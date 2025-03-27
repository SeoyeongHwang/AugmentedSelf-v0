"use client"

import { useOnboarding } from "@/contexts/onboarding-context"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

export default function ValuesAssessmentForm() {
  const { data, updateValueItem } = useOnboarding()
  const { personal } = data

  return (
    <Card>
      <CardHeader>
        <CardTitle>Values Assessment (PVQ)</CardTitle>
        <CardDescription>
          Rate how important each value is to you from 1 (not important) to 7 (extremely important).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {personal.valueItems.map((item) => (
          <div key={item.id} className="space-y-2">
            <Label htmlFor={item.id}>{item.text}</Label>
            <RadioGroup
              id={item.id}
              value={item.score.toString()}
              onValueChange={(value) => updateValueItem(item.id, Number.parseInt(value))}
              className="flex justify-between mt-2"
            >
              {[1, 2, 3, 4, 5, 6, 7].map((value) => (
                <div key={value} className="flex flex-col items-center">
                  <RadioGroupItem value={value.toString()} id={`${item.id}-${value}`} />
                  <Label htmlFor={`${item.id}-${value}`} className="mt-1 text-xs">
                    {value}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Not important</span>
              <span>Extremely important</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
} 