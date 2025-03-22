import { storage } from "./storage";

async function testDatabaseAccess() {
  try {
    console.log("Testing database access...");
    
    // Test getting all categories
    console.log("Getting all categories:");
    const categories = await storage.getAllCategories();
    console.log(JSON.stringify(categories, null, 2));
    
    // Test getting all tags
    console.log("\nGetting all tags:");
    const tags = await storage.getAllTags();
    console.log(JSON.stringify(tags, null, 2));
    
    // Test getting all scripts
    console.log("\nGetting all scripts:");
    const scripts = await storage.getAllScripts();
    console.log(JSON.stringify(scripts, null, 2));
    
    // Test getting featured scripts
    console.log("\nGetting featured scripts:");
    const featuredScripts = await storage.getFeaturedScripts(3);
    console.log(JSON.stringify(featuredScripts, null, 2));
    
    // Test getting trending scripts
    console.log("\nGetting trending scripts:");
    const trendingScripts = await storage.getTrendingScripts(7, 3);
    console.log(JSON.stringify(trendingScripts, null, 2));
    
  } catch (error) {
    console.error("Error testing database access:", error);
  }
}

// Execute the tests
testDatabaseAccess().then(() => {
  console.log("Database tests completed");
}).catch(err => {
  console.error("Test execution failed:", err);
});