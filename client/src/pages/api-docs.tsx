import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BackButton from "@/components/BackButton";

export default function ApiDocs() {
  return (
    <div className="container mx-auto py-10">
      <BackButton />
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">API Documentation</h1>
        <p className="text-muted-foreground mt-2">
          This page provides documentation for our public API that can be used to integrate with Roblox executors and other external services.
        </p>
      </div>
      
      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="scripts">Scripts</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="tags">Tags</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>API Overview</CardTitle>
              <CardDescription>Basic information about the API</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Base URL</h3>
                <p className="text-sm text-muted-foreground mt-1">All API endpoints are relative to:</p>
                <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
                  https://yourdomain.com/api/v1
                </code>
              </div>
              
              <div>
                <h3 className="text-lg font-medium">Authentication</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  No authentication is required for the public API. All endpoints are publicly accessible.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium">Rate Limiting</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  To ensure service availability, the API is rate-limited to 100 requests per minute per IP address.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium">Response Format</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  All responses are in JSON format. Error responses include an <code>error</code> field and a <code>message</code> field.
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Integration Example</CardTitle>
              <CardDescription>Example of integrating with a Roblox executor</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-md">
                <pre className="text-sm overflow-auto">
{`-- Lua example for Roblox executor integration
local API_BASE = "https://yourdomain.com/api/v1"

local function fetchScripts(category, tag, page, callback)
    local url = API_BASE.."/scripts"
    
    -- Add query parameters if provided
    local params = {}
    if category then table.insert(params, "category="..category) end
    if tag then table.insert(params, "tag="..tag) end
    if page then table.insert(params, "page="..page) end
    
    if #params > 0 then
        url = url.."?"..table.concat(params, "&")
    end
    
    -- Make HTTP request (implementation depends on executor)
    request({
        Url = url,
        Method = "GET",
    }, function(response)
        if response.StatusCode == 200 then
            local data = game:GetService("HttpService"):JSONDecode(response.Body)
            callback(data.scripts, data.pagination)
        else
            callback(nil, nil, "Error: "..response.StatusCode)
        end
    end)
end

local function loadScriptById(id, callback)
    request({
        Url = API_BASE.."/scripts/"..id,
        Method = "GET",
    }, function(response)
        if response.StatusCode == 200 then
            local scriptData = game:GetService("HttpService"):JSONDecode(response.Body)
            callback(scriptData)
        else
            callback(nil, "Error: "..response.StatusCode)
        end
    end)
end

-- Usage example:
fetchScripts(1, nil, 1, function(scripts, pagination, error)
    if error then
        print(error)
        return
    end
    
    for _, script in ipairs(scripts) do
        print(script.title)
    end
end)

loadScriptById(1, function(scriptData, error)
    if error then
        print(error)
        return
    end
    
    -- Execute the script code
    loadstring(scriptData.code)()
end)`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="scripts" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Scripts Endpoints</CardTitle>
              <CardDescription>API endpoints for accessing script data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium">GET /scripts</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Returns a paginated list of scripts with optional filtering.
                </p>
                
                <div className="mt-2">
                  <h4 className="font-medium">Query Parameters:</h4>
                  <ul className="list-disc pl-5 text-sm">
                    <li><code>page</code> - Page number (default: 1)</li>
                    <li><code>limit</code> - Results per page (default: 50, max: 100)</li>
                    <li><code>category</code> - Filter by category ID</li>
                    <li><code>tag</code> - Filter by tag ID</li>
                    <li><code>search</code> - Search query</li>
                  </ul>
                </div>
                
                <div className="mt-4">
                  <h4 className="font-medium">Response:</h4>
                  <div className="bg-muted p-2 rounded-md mt-1">
                    <pre className="text-xs overflow-auto">
{`{
  "scripts": [
    {
      "id": 1,
      "title": "Script Title",
      "description": "Script description",
      "code": "print('Hello World')",
      "gameLink": "https://www.roblox.com/games/123456/Game-Name",
      "gameType": "RPG",
      "category": 1,
      "tags": [
        { "id": 1, "name": "Beginner Friendly", "slug": "beginner-friendly" }
      ],
      "views": 100,
      "copies": 50,
      "avgRating": 4.5,
      "lastUpdated": "2025-03-22T10:31:03.666Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "totalPages": 2
  }
}`}
                    </pre>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium">GET /scripts/:id</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Returns detailed information about a specific script.
                </p>
                
                <div className="mt-2">
                  <h4 className="font-medium">URL Parameters:</h4>
                  <ul className="list-disc pl-5 text-sm">
                    <li><code>id</code> - Script ID</li>
                  </ul>
                </div>
                
                <div className="mt-4">
                  <h4 className="font-medium">Response:</h4>
                  <div className="bg-muted p-2 rounded-md mt-1">
                    <pre className="text-xs overflow-auto">
{`{
  "id": 1,
  "title": "Script Title",
  "description": "Script description",
  "code": "print('Hello World')",
  "gameLink": "https://www.roblox.com/games/123456/Game-Name",
  "gameType": "RPG",
  "category": 1,
  "tags": [
    { "id": 1, "name": "Beginner Friendly", "slug": "beginner-friendly" }
  ],
  "views": 100,
  "copies": 50,
  "avgRating": 4.5,
  "lastUpdated": "2025-03-22T10:31:03.666Z"
}`}
                    </pre>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="categories" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Categories Endpoints</CardTitle>
              <CardDescription>API endpoints for script categories</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium">GET /categories</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Returns a list of all script categories.
                </p>
                
                <div className="mt-4">
                  <h4 className="font-medium">Response:</h4>
                  <div className="bg-muted p-2 rounded-md mt-1">
                    <pre className="text-xs overflow-auto">
{`[
  {
    "id": 1,
    "name": "Combat Scripts",
    "description": "Scripts for combat mechanics and fighting systems",
    "slug": "combat-scripts",
    "imageUrl": "/images/categories/combat.png",
    "order": 1,
    "createdAt": "2025-03-22T10:20:20.964Z"
  },
  {
    "id": 2,
    "name": "UI/GUI Scripts",
    "description": "User interface components and GUI frameworks",
    "slug": "ui-gui-scripts",
    "imageUrl": "/images/categories/ui.png",
    "order": 2,
    "createdAt": "2025-03-22T10:20:21.122Z"
  }
]`}
                    </pre>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="tags" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Tags Endpoints</CardTitle>
              <CardDescription>API endpoints for script tags</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium">GET /tags</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Returns a list of all script tags.
                </p>
                
                <div className="mt-4">
                  <h4 className="font-medium">Response:</h4>
                  <div className="bg-muted p-2 rounded-md mt-1">
                    <pre className="text-xs overflow-auto">
{`[
  {
    "id": 1,
    "name": "Beginner Friendly",
    "slug": "beginner-friendly",
    "description": "Easy to understand and implement",
    "color": "#4CAF50",
    "createdAt": "2025-03-22T10:20:21.825Z"
  },
  {
    "id": 2,
    "name": "Advanced",
    "slug": "advanced",
    "description": "Complex scripts for experienced developers",
    "color": "#F44336",
    "createdAt": "2025-03-22T10:20:21.981Z"
  }
]`}
                    </pre>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}