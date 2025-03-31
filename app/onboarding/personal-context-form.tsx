"use client"

import { useOnboarding } from "@/contexts/onboarding-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"
import { OnboardingData, PersonalContext, PersonalContextUpdate } from "@/types/onboarding"

export default function PersonalContextForm() {
  const { data, updatePersonalContext } = useOnboarding()
  const [fileInputs, setFileInputs] = useState<{ [key: string]: File | null }>({})

  const handleFileChange = async (contextId: string, file: File | null) => {
    if (!file) {
      updatePersonalContext(contextId, { type: 'text', content: '', fileUrl: undefined })
      setFileInputs((prev) => ({ ...prev, [contextId]: null }))
      return
    }

    try {
      // Here you would typically upload the file to your storage service
      // For now, we'll just use a placeholder URL
      const fileUrl = URL.createObjectURL(file)
      updatePersonalContext(contextId, { type: 'file', content: file.name, fileUrl })
      setFileInputs((prev) => ({ ...prev, [contextId]: file }))
    } catch (error) {
      console.error('Error handling file:', error)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Personal Context</h2>
      <p className="text-muted-foreground">
        Please provide 3 personal contexts that will help us understand you better. You can either write text or upload files.
      </p>

      {data.context.contexts.map((context: PersonalContext) => (
        <Card key={context.id} className="p-4 space-y-4">
          <div className="space-y-2">
            <Select
              value={context.type}
              onValueChange={(value: 'text' | 'file') =>
                updatePersonalContext(context.id, { type: value, content: '', fileUrl: undefined })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select input type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="file">File</SelectItem>
              </SelectContent>
            </Select>

            {context.type === 'text' ? (
              <Textarea
                placeholder="Write about your personal context..."
                value={context.content}
                onChange={(e) => updatePersonalContext(context.id, { content: e.target.value })}
                className="min-h-[100px]"
              />
            ) : (
              <div className="space-y-2">
                <Input
                  type="file"
                  onChange={(e) => handleFileChange(context.id, e.target.files?.[0] || null)}
                  accept=".txt,.pdf,.doc,.docx"
                />
                {context.fileUrl && (
                  <p className="text-sm text-muted-foreground">
                    Selected file: {context.content}
                  </p>
                )}
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  )
}

