const { execSync } = require('child_process');

const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wb2JvbXN3aHN3bmhudnBjZ25hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTU0MTQ1NywiZXhwIjoyMDg3MTE3NDU3fQ.FF5jS_xaJrN_w55G7Muv5Qkwk1g_tLE3pD40bSPfpJo";

try {
    console.log("Removing old key...");
    execSync('npx vercel env rm SUPABASE_SERVICE_ROLE_KEY production --yes', { stdio: 'inherit' });
} catch(e) {
    console.log("Old key already removed or failed.");
}

try {
    console.log("Injecting correct key...");
    // Using simple command with node to avoid powershell newline echo issues
    execSync(`node -e "process.stdout.write('${key}')" | npx vercel env add SUPABASE_SERVICE_ROLE_KEY production`, { stdio: 'inherit' });
    console.log("Injection Success!");
} catch(e) {
    console.error("Injection failed", e);
}
