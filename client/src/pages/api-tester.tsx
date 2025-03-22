import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ApiTester() {
  const [selectedEndpoint, setSelectedEndpoint] = useState('scripts');
  const [testResult, setTestResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // This is a direct fetch to test the endpoint
  const testEndpoint = async (endpoint: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // Use direct fetch API instead of relying on queryClient
      // Also include a random query parameter to bypass any caching
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/${endpoint}?_t=${timestamp}`, {
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest' // Some servers use this to detect AJAX requests
        }
      });
      
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        // If not JSON, get the text and try to parse it
        const text = await response.text();
        try {
          data = JSON.parse(text);
        } catch (e) {
          console.log('Response is not JSON:', text.substring(0, 500) + '...');
          throw new Error('API did not return JSON. Check console for details.');
        }
      }
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText} - ${JSON.stringify(data)}`);
      }
      
      setTestResult(data);
    } catch (err) {
      console.error('API test error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setTestResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedEndpoint) {
      testEndpoint(selectedEndpoint);
    }
  }, [selectedEndpoint]);

  const endpoints = [
    { id: 'scripts', name: 'Scripts' },
    { id: 'categories', name: 'Categories' },
    { id: 'tags', name: 'Tags' },
    { id: 'scripts/featured', name: 'Featured Scripts' },
    { id: 'scripts/trending', name: 'Trending Scripts' },
  ];

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">API Endpoint Tester</CardTitle>
          <CardDescription>Test the API endpoints to ensure they're working correctly</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="scripts" value={selectedEndpoint} onValueChange={setSelectedEndpoint}>
            <TabsList>
              {endpoints.map(endpoint => (
                <TabsTrigger key={endpoint.id} value={endpoint.id}>
                  {endpoint.name}
                </TabsTrigger>
              ))}
            </TabsList>
            <div className="mt-4">
              <h3 className="text-lg font-medium mb-2">Endpoint: /api/{selectedEndpoint}</h3>
              {isLoading ? (
                <div className="py-4 text-center">Loading data...</div>
              ) : error ? (
                <div className="py-4 text-red-500">{error}</div>
              ) : (
                <pre className="p-4 bg-muted rounded-md overflow-auto max-h-96">
                  {testResult ? JSON.stringify(testResult, null, 2) : 'No data'}
                </pre>
              )}
            </div>
          </Tabs>
        </CardContent>
        <CardFooter>
          <Button onClick={() => testEndpoint(selectedEndpoint)} disabled={isLoading}>
            {isLoading ? 'Testing...' : 'Test Again'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}