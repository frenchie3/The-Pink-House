import { Message } from "@/components/form-message";
import React from "react";

interface SignInLayoutProps {
  children: React.ReactNode;
  searchParams: { type?: string; message?: string };
}

export default function SignInLayout({
  children,
  searchParams,
}: SignInLayoutProps) {
  // Convert searchParams to Message type
  const message: Message = searchParams.type && searchParams.message
    ? { type: searchParams.type as Message["type"], message: searchParams.message }
    : { type: "success", message: "" };

  // Clone the children with the message prop
  const childrenWithProps = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child as React.ReactElement<any>, { 
        searchParams: message 
      });
    }
    return child;
  });

  return <>{childrenWithProps}</>;
} 