// Vyon is a static HTML/JS site, not a Next.js or React application.
// The Next.js <Analytics /> component is not applicable here.
// Vercel's supported vanilla integration automatically tracks page views.
import {inject} from "@vercel/analytics";

inject({mode:"production"});
