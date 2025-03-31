"use client"

import { useState } from "react"
import type { SelfAspectCard } from "@/types/onboarding"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ThumbsUp, ThumbsDown, Info } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"

interface SelfAspectCardProps {
  card: SelfAspectCard
  onCollect: (card: SelfAspectCard) => void
  onReject: (card: SelfAspectCard) => void
}

export function SelfAspectCardComponent({ card, onCollect, onReject }: SelfAspectCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  // Format date to locale string
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  return (
    <>
      <Card className="h-[320px] flex flex-col">
        <CardHeader>
          <CardTitle className="h-14 line-clamp-2 leading-[1.2] mb-2">{card.title}</CardTitle>
          <div className="flex flex-wrap gap-1 mt-0">
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
        <CardContent className="flex-1 overflow-hidden">
          <p className="text-sm text-muted-foreground line-clamp-4">{card.description}</p>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-2 justify-between items-start sm:items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsOpen(true)} 
            className="text-xs text-muted-foreground px-2"
          >
            <Info className="h-3 w-3 mr-1" />
            Read More
          </Button>
          
          <div className="flex flex-wrap gap-2 w-fit justify-end">
            {card.status === "new" ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onCollect(card)}
                  className="h-8 px-2 text-xs"
                >
                  <ThumbsUp className="mr-1 h-3 w-3" />
                  <span className="hidden sm:inline">Collect</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onReject(card)}
                  className="h-8 px-2 text-xs"
                >
                  <ThumbsDown className="mr-1 h-3 w-3" />
                  <span className="hidden sm:inline">Reject</span>
                </Button>
              </>
            ) : card.status === "collected" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onReject(card)}
                className="h-8 px-2 text-xs"
              >
                <ThumbsDown className="mr-1 h-3 w-3" />
                <span className="hidden sm:inline">Reject</span>
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCollect(card)}
                className="h-8 px-2 text-xs"
              >
                <ThumbsUp className="mr-1 h-3 w-3" />
                <span className="hidden sm:inline">Collect</span>
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>

      {/* Card Detail Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader className="space-y-4">
            <DialogTitle>{card.title}</DialogTitle>
            <div className="flex flex-wrap gap-1 mt-0">
              {card.traits.map((trait) => (
                <span
                  key={trait}
                  className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold"
                >
                  {trait}
                </span>
              ))}
            </div>
          </DialogHeader>
          <DialogDescription className="text-sm text-muted-foreground mb-4">
            {card.description}
          </DialogDescription>
          <DialogFooter className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Created: {formatDate(card.created_at || "")}</p>
              {card.status !== "new" && (
                <p>Last modified: {formatDate(card.updated_at || "")}</p>
              )}
            </div>
            <div className="flex justify-end gap-2 shrink-0">
              {card.status === "new" ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onCollect(card);
                      setIsOpen(false);
                    }}
                  >
                    <ThumbsUp className="mr-2 h-4 w-4" />
                    Collect
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onReject(card);
                      setIsOpen(false);
                    }}
                  >
                    <ThumbsDown className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                </>
              ) : card.status === "collected" ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onReject(card);
                    setIsOpen(false);
                  }}
                >
                  <ThumbsDown className="mr-2 h-4 w-4" />
                  Reject
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onCollect(card);
                    setIsOpen(false);
                  }}
                >
                  <ThumbsUp className="mr-2 h-4 w-4" />
                  Collect
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

