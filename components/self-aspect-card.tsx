"use client"

import type { SelfAspectCard } from "@/types/onboarding"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ThumbsUp, ThumbsDown } from "lucide-react"

interface SelfAspectCardProps {
  card: SelfAspectCard
  onCollect: (card: SelfAspectCard) => void
  onReject: (card: SelfAspectCard) => void
}

export function SelfAspectCardComponent({ card, onCollect, onReject }: SelfAspectCardProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>{card.title}</CardTitle>
        <div className="flex flex-wrap gap-1 mt-2">
          {card.traits.map((trait) => (
            <span
              key={trait}
              className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold"
            >
              {trait}
            </span>
          ))}
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="text-sm text-muted-foreground">{card.description}</p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant={card.status === "collected" ? "default" : "outline"}
          size="sm"
          onClick={() => onCollect(card)}
          className={card.status === "collected" ? "bg-green-600 hover:bg-green-700" : ""}
        >
          <ThumbsUp className="mr-2 h-4 w-4" />
          Collect
        </Button>
        <Button
          variant={card.status === "rejected" ? "default" : "outline"}
          size="sm"
          onClick={() => onReject(card)}
          className={card.status === "rejected" ? "bg-red-600 hover:bg-red-700" : ""}
        >
          <ThumbsDown className="mr-2 h-4 w-4" />
          Reject
        </Button>
      </CardFooter>
    </Card>
  )
}

