"use client"

import { useOnboarding } from "@/contexts/onboarding-context"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function PersonalContextForm() {
  const { data, updatePersonalContext } = useOnboarding()
  const { context } = data

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Personal Life Context</CardTitle>
          <CardDescription>Write about your daily routines, personal preferences, and life experiences</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="diary">Personal Diary</Label>
            <Textarea
              id="diary"
              placeholder="Share your thoughts, daily routines, and personal preferences..."
              className="min-h-[300px]"
              value={context.diary}
              onChange={(e) => updatePersonalContext({ diary: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              This information helps us understand your personal context and identify your self-aspects. Write as much
              as you feel comfortable sharing.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

