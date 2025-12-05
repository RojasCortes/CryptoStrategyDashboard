import { Button } from '@/components/ui/button';
import { FcGoogle } from "react-icons/fc";

interface OauthSignInProps {
  onGoogleSignIn: () => void;
  isLoading?: boolean;
}

export default function OauthSignIn({ onGoogleSignIn, isLoading = false }: OauthSignInProps) {
  return (
    <div className="mt-4">
      <Button
        variant="outline"
        type="button"
        className="w-full h-[50px] rounded-2xl text-zinc-950 dark:text-white border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all duration-300"
        disabled={isLoading}
        onClick={onGoogleSignIn}
      >
        <span className="mr-2">
          <FcGoogle className="h-5 w-5" />
        </span>
        <span className="font-medium">
          {isLoading ? "Signing in..." : "Sign in with Google"}
        </span>
      </Button>
    </div>
  );
}
