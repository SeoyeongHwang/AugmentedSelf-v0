"use client"

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import type { SelfAspectCard } from '@/types/onboarding'

// Chart.js 등록
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface TraitsAnalysisProps {
  cards: SelfAspectCard[]
}

export function TraitsAnalysis({ cards }: TraitsAnalysisProps) {
  // traits 빈도 계산
  const traitFrequencies = useMemo(() => {
    const frequencies: Record<string, number> = {}
    
    cards.forEach(card => {
      card.traits.forEach(trait => {
        frequencies[trait] = (frequencies[trait] || 0) + 1
      })
    })

    // 빈도수 기준으로 정렬
    return Object.entries(frequencies)
      .sort(([, a], [, b]) => b - a)
      .reduce((obj, [key, value]) => ({
        ...obj,
        [key]: value
      }), {})
  }, [cards])

  // 차트 데이터 준비
  const chartData = {
    labels: Object.keys(traitFrequencies),
    datasets: [
      {
        label: '등장 빈도',
        data: Object.values(traitFrequencies),
        backgroundColor: 'rgba(124, 58, 237, 0.5)',
        borderColor: 'rgba(124, 58, 237, 1)',
        borderWidth: 1
      }
    ]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>특성 분석</CardTitle>
      </CardHeader>
      <CardContent>
        {cards.length > 0 ? (
          <div className="space-y-6">
            <div className="h-[400px]">
              <Bar data={chartData} options={chartOptions} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {Object.entries(traitFrequencies).map(([trait, frequency]) => (
                <Card key={trait} className="p-4">
                  <div className="text-lg font-semibold">{trait}</div>
                  <div className="text-sm text-muted-foreground">
                    {frequency}회 등장
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            수집된 카드가 없습니다.
          </div>
        )}
      </CardContent>
    </Card>
  )
} 