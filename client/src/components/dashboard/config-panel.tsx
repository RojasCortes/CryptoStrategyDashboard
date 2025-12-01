import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Strategy, InsertStrategy, insertStrategySchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { useAvailablePairs } from "@/hooks/use-binance";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface ConfigPanelProps {
  selectedStrategy: Strategy | null;
  onStrategyUpdated: () => void;
}

const strategyTypes = [
  { value: "MACD Crossover", label: "MACD Crossover" },
  { value: "RSI Oversold/Overbought", label: "RSI Oversold/Overbought" },
  { value: "Bollinger Bands", label: "Bollinger Bands" },
  { value: "Moving Average Cross", label: "Moving Average Cross" },
  { value: "Custom Strategy", label: "Custom Strategy" },
];

const timeframes = [
  { value: "5m", label: "5 minutes" },
  { value: "15m", label: "15 minutes" },
  { value: "1h", label: "1 hour" },
  { value: "4h", label: "4 hours" },
  { value: "1d", label: "1 day" },
];

const extendedSchema = insertStrategySchema.omit({ userId: true }).extend({
  macdFast: z.coerce.number().optional(),
  macdSlow: z.coerce.number().optional(),
  macdSignal: z.coerce.number().optional(),
  rsiPeriod: z.coerce.number().optional(),
  rsiOverbought: z.coerce.number().optional(),
  rsiOversold: z.coerce.number().optional(),
  bbPeriod: z.coerce.number().optional(),
  bbDeviation: z.coerce.number().optional(),
  maPeriod1: z.coerce.number().optional(),
  maPeriod2: z.coerce.number().optional(),
});

type FormValues = z.infer<typeof extendedSchema>;

export function ConfigPanel({ selectedStrategy, onStrategyUpdated }: ConfigPanelProps) {
  const { user } = useFirebaseAuth();
  const { toast } = useToast();
  const { pairs, isLoading: isPairsLoading } = useAvailablePairs();
  const [parameterFields, setParameterFields] = useState<JSX.Element | null>(null);

  // Create or update strategy mutation
  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      // Extract strategy parameters based on strategy type
      const parameters: Record<string, number> = {};
      
      if (values.strategyType === "MACD Crossover") {
        parameters.fast = values.macdFast || 12;
        parameters.slow = values.macdSlow || 26;
        parameters.signal = values.macdSignal || 9;
      } else if (values.strategyType === "RSI Oversold/Overbought") {
        parameters.period = values.rsiPeriod || 14;
        parameters.overbought = values.rsiOverbought || 70;
        parameters.oversold = values.rsiOversold || 30;
      } else if (values.strategyType === "Bollinger Bands") {
        parameters.period = values.bbPeriod || 20;
        parameters.deviation = values.bbDeviation || 2;
      } else if (values.strategyType === "Moving Average Cross") {
        parameters.period1 = values.maPeriod1 || 50;
        parameters.period2 = values.maPeriod2 || 200;
      }
      
      const strategyData: Partial<InsertStrategy> = {
        userId: user?.id,
        name: values.name,
        pair: values.pair,
        strategyType: values.strategyType,
        timeframe: values.timeframe,
        parameters,
        riskPerTrade: values.riskPerTrade,
        isActive: values.isActive,
        emailNotifications: values.emailNotifications,
      };
      
      if (selectedStrategy) {
        const res = await apiRequest(
          "PATCH",
          `/api/strategies/${selectedStrategy.id}`,
          strategyData
        );
        return await res.json();
      } else {
        const res = await apiRequest("POST", "/api/strategies", strategyData);
        return await res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/strategies"] });
      toast({
        title: selectedStrategy ? "Strategy updated" : "Strategy created",
        description: selectedStrategy
          ? "Your strategy has been updated successfully"
          : "Your new strategy has been created successfully",
      });
      onStrategyUpdated();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Default values for the form
  let defaultValues: Partial<FormValues> = {
    name: "",
    pair: "BTCUSDT",
    strategyType: "MACD Crossover",
    timeframe: "4h",
    riskPerTrade: 1.5,
    isActive: false,
    emailNotifications: true,
    macdFast: 12,
    macdSlow: 26,
    macdSignal: 9,
  };

  // If editing an existing strategy, set default values
  if (selectedStrategy) {
    defaultValues = {
      ...defaultValues,
      name: selectedStrategy.name,
      pair: selectedStrategy.pair,
      strategyType: selectedStrategy.strategyType,
      timeframe: selectedStrategy.timeframe,
      riskPerTrade: selectedStrategy.riskPerTrade,
      isActive: selectedStrategy.isActive,
      emailNotifications: selectedStrategy.emailNotifications,
    };

    // Set parameters based on strategy type
    const params = selectedStrategy.parameters as Record<string, number>;
    if (selectedStrategy.strategyType === "MACD Crossover") {
      defaultValues.macdFast = params.fast;
      defaultValues.macdSlow = params.slow;
      defaultValues.macdSignal = params.signal;
    } else if (selectedStrategy.strategyType === "RSI Oversold/Overbought") {
      defaultValues.rsiPeriod = params.period;
      defaultValues.rsiOverbought = params.overbought;
      defaultValues.rsiOversold = params.oversold;
    } else if (selectedStrategy.strategyType === "Bollinger Bands") {
      defaultValues.bbPeriod = params.period;
      defaultValues.bbDeviation = params.deviation;
    } else if (selectedStrategy.strategyType === "Moving Average Cross") {
      defaultValues.maPeriod1 = params.period1;
      defaultValues.maPeriod2 = params.period2;
    }
  }

  const form = useForm<FormValues>({
    resolver: zodResolver(extendedSchema),
    defaultValues,
  });

  // Watch strategy type to show different parameters
  const strategyType = form.watch("strategyType");

  useEffect(() => {
    // Update parameter fields based on strategy type
    switch (strategyType) {
      case "MACD Crossover":
        setParameterFields(
          <>
            <FormField
              control={form.control}
              name="macdFast"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>MACD Fast EMA</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="macdSlow"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>MACD Slow EMA</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="macdSignal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>MACD Signal</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        );
        break;
      case "RSI Oversold/Overbought":
        setParameterFields(
          <>
            <FormField
              control={form.control}
              name="rsiPeriod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>RSI Period</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="rsiOverbought"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>RSI Overbought Level</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="rsiOversold"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>RSI Oversold Level</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        );
        break;
      case "Bollinger Bands":
        setParameterFields(
          <>
            <FormField
              control={form.control}
              name="bbPeriod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bollinger Bands Period</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bbDeviation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Standard Deviation</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        );
        break;
      case "Moving Average Cross":
        setParameterFields(
          <>
            <FormField
              control={form.control}
              name="maPeriod1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fast MA Period</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="maPeriod2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slow MA Period</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        );
        break;
      default:
        setParameterFields(null);
        break;
    }
  }, [strategyType, form]);

  const onSubmit = (values: FormValues) => {
    mutation.mutate(values);
  };

  if (isPairsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-6 w-48" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="mb-4">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
          <Skeleton className="h-10 w-full mt-4" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="bg-muted border-b">
        <CardTitle>
          {selectedStrategy ? "Edit Strategy" : "New Strategy"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Strategy Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pair"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cryptocurrency Pair</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a pair" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {pairs.map((pair) => (
                        <SelectItem key={pair.symbol} value={pair.symbol}>
                          {pair.baseAsset}/{pair.quoteAsset}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="strategyType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Strategy Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a strategy type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {strategyTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="timeframe"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Timeframe</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a timeframe" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {timeframes.map((tf) => (
                        <SelectItem key={tf.value} value={tf.value}>
                          {tf.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="p-3 bg-primary/10 rounded space-y-3">
              <h3 className="text-sm font-medium">Strategy Parameters</h3>
              {parameterFields}
            </div>

            <FormField
              control={form.control}
              name="riskPerTrade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Risk per Trade (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="100"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Percentage of your portfolio to risk on each trade
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="emailNotifications"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Email Notifications</FormLabel>
                    <FormDescription>
                      Receive email notifications for trades and alerts
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Activate Strategy</FormLabel>
                    <FormDescription>
                      Start running this strategy immediately
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Saving..." : "Save Strategy"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
