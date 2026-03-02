'use client';

import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function AuthPage() {
  return (
    <div className="container mx-auto py-8 text-center">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>This area is restricted. Please contact the site administrator.</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
