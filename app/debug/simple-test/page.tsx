"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function SimpleTestPage() {
  const runSimpleTest = () => {
    console.log("Simple test executed")
    alert("Simple test completed - check console for details")
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Simple Test</h1>

      <Card>
        <CardHeader>
          <CardTitle>Basic Functionality Test</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">This page tests basic React functionality and component rendering.</p>
          <Button onClick={runSimpleTest}>Run Simple Test</Button>
        </CardContent>
      </Card>
    </div>
  )
}
