import { useState } from "react";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sidebar } from "@/components/dashboard/sidebar";
import { AppBar } from "@/components/dashboard/app-bar";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, KeyRound, User, Bell, Shield } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// API Keys Form Schema
const apiKeysSchema = z.object({
  apiKey: z.string().min(1, "API Key is required"),
  apiSecret: z.string().min(1, "API Secret is required"),
});

type ApiKeysFormValues = z.infer<typeof apiKeysSchema>;

// Profile Form Schema
const profileSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

// Password Change Schema
const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Confirm password is required"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

// Notification Settings Schema
const notificationSchema = z.object({
  emailNotifications: z.boolean().default(true),
  tradeAlerts: z.boolean().default(true),
  priceAlerts: z.boolean().default(true),
  weeklyReports: z.boolean().default(true),
});

type NotificationFormValues = z.infer<typeof notificationSchema>;

export default function SettingsPage(): JSX.Element {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const { user, updateApiKeysMutation } = useFirebaseAuth();
  const { toast } = useToast();
  const [sendingTestEmail, setSendingTestEmail] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // API Keys Form
  const apiKeysForm = useForm<ApiKeysFormValues>({
    resolver: zodResolver(apiKeysSchema),
    defaultValues: {
      apiKey: user?.apiKey || "",
      apiSecret: user?.apiSecret || "",
    },
  });

  const onApiKeysSubmit = (values: ApiKeysFormValues) => {
    updateApiKeysMutation.mutate(values);
  };

  // Profile Form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: user?.username || "",
      email: user?.email || "",
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const res = await apiRequest("PUT", "/api/user/profile", data);
      return res.json();
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["/api/user"], updatedUser);
      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update profile",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onProfileSubmit = (values: ProfileFormValues) => {
    updateProfileMutation.mutate(values);
  };

  // Password Form
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async (data: PasswordFormValues) => {
      const res = await apiRequest("PUT", "/api/user/password", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      });
      passwordForm.reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update password",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onPasswordSubmit = (values: PasswordFormValues) => {
    updatePasswordMutation.mutate(values);
  };

  // Notification Settings Form
  const notificationForm = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      emailNotifications: true,
      tradeAlerts: true,
      priceAlerts: true,
      weeklyReports: true,
    },
  });

  const updateNotificationsMutation = useMutation({
    mutationFn: async (data: NotificationFormValues) => {
      const res = await apiRequest("PUT", "/api/user/notifications", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Notification settings updated",
        description: "Your notification preferences have been saved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update notification settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onNotificationSubmit = (values: NotificationFormValues) => {
    updateNotificationsMutation.mutate(values);
  };
  
  // Función para enviar email de prueba
  const sendTestEmail = async () => {
    if (!user?.email) return;
    
    setSendingTestEmail(true);
    try {
      const res = await apiRequest("POST", "/api/email/test", { email: user.email });
      const data = await res.json();
      
      if (data.success) {
        toast({
          title: "Email de prueba enviado",
          description: data.message,
        });
      } else {
        toast({
          title: "Error al enviar email",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error al enviar email",
        description: "No se pudo enviar el email de prueba. Por favor, contacta al administrador.",
        variant: "destructive",
      });
    } finally {
      setSendingTestEmail(false);
    }
  };

  if (!user) {
    // Protected route should handle this, but just in case
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Please log in to access settings.</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-muted/30">
      <Sidebar isMobile={isMobile} isOpen={sidebarOpen} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppBar toggleSidebar={toggleSidebar} />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-semibold">Account Settings</h1>
            </div>
            
            <Tabs defaultValue="profile" className="space-y-6">
              <TabsList className="space-x-2">
                <TabsTrigger value="profile" className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Profile</span>
                </TabsTrigger>
                <TabsTrigger value="api" className="flex items-center space-x-2">
                  <KeyRound className="h-4 w-4" />
                  <span>API Keys</span>
                </TabsTrigger>
                <TabsTrigger value="security" className="flex items-center space-x-2">
                  <Shield className="h-4 w-4" />
                  <span>Security</span>
                </TabsTrigger>
                <TabsTrigger value="notifications" className="flex items-center space-x-2">
                  <Bell className="h-4 w-4" />
                  <span>Notifications</span>
                </TabsTrigger>
              </TabsList>
              
              {/* Profile Section */}
              <TabsContent value="profile">
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>
                      Update your account details and contact information.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...profileForm}>
                      <form className="space-y-6" onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
                        <FormField
                          control={profileForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormDescription>
                                This is your public display name.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={profileForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input type="email" {...field} />
                              </FormControl>
                              <FormDescription>
                                We'll use this email for notifications and important updates.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="flex flex-col sm:flex-row gap-4">
                          <Button 
                            type="submit" 
                            disabled={updateProfileMutation.isPending}
                          >
                            {updateProfileMutation.isPending ? "Updating..." : "Update Profile"}
                          </Button>
                          
                          <Button 
                            type="button"
                            variant="outline"
                            onClick={sendTestEmail}
                            disabled={sendingTestEmail}
                          >
                            {sendingTestEmail ? "Enviando..." : "Enviar Email de Prueba"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* API Keys Section */}
              <TabsContent value="api">
                <Card>
                  <CardHeader>
                    <CardTitle>Binance API Keys</CardTitle>
                    <CardDescription>
                      Connect your Binance account to enable trading strategies.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Important</AlertTitle>
                      <AlertDescription>
                        Generate API keys from your Binance account with read and trading permissions. 
                        We recommend not enabling withdrawal permissions for security.
                      </AlertDescription>
                    </Alert>
                    
                    <Form {...apiKeysForm}>
                      <form className="space-y-6" onSubmit={apiKeysForm.handleSubmit(onApiKeysSubmit)}>
                        <FormField
                          control={apiKeysForm.control}
                          name="apiKey"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>API Key</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={apiKeysForm.control}
                          name="apiSecret"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>API Secret</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} />
                              </FormControl>
                              <FormDescription>
                                Your API secret is encrypted and stored securely.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button 
                          type="submit" 
                          disabled={updateApiKeysMutation.isPending}
                        >
                          {updateApiKeysMutation.isPending ? "Updating..." : "Save API Keys"}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Security Section */}
              <TabsContent value="security">
                <Card>
                  <CardHeader>
                    <CardTitle>Change Password</CardTitle>
                    <CardDescription>
                      Update your password to maintain account security.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...passwordForm}>
                      <form className="space-y-6" onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}>
                        <FormField
                          control={passwordForm.control}
                          name="currentPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Current Password</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Separator className="my-4" />
                        
                        <FormField
                          control={passwordForm.control}
                          name="newPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>New Password</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} />
                              </FormControl>
                              <FormDescription>
                                Password must be at least 6 characters long.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={passwordForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirm New Password</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button 
                          type="submit" 
                          disabled={updatePasswordMutation.isPending}
                        >
                          {updatePasswordMutation.isPending ? "Updating..." : "Change Password"}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Notifications Section */}
              <TabsContent value="notifications">
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                    <CardDescription>
                      Manage how and when you receive notifications.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...notificationForm}>
                      <form className="space-y-6" onSubmit={notificationForm.handleSubmit(onNotificationSubmit)}>
                        <FormField
                          control={notificationForm.control}
                          name="emailNotifications"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Email Notifications</FormLabel>
                                <FormDescription>
                                  Receive all notifications via email.
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
                          control={notificationForm.control}
                          name="tradeAlerts"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Trade Alerts</FormLabel>
                                <FormDescription>
                                  Get notified when trades are executed.
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
                          control={notificationForm.control}
                          name="priceAlerts"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Price Alerts</FormLabel>
                                <FormDescription>
                                  Get notified on significant price movements.
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
                          control={notificationForm.control}
                          name="weeklyReports"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Weekly Reports</FormLabel>
                                <FormDescription>
                                  Receive weekly performance reports.
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
                          disabled={updateNotificationsMutation.isPending}
                        >
                          {updateNotificationsMutation.isPending ? "Saving..." : "Save Preferences"}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}