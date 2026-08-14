import { createRouteHandler } from "uploadthing/next";
// Ajusta la ruta a donde tengas tu archivo core.ts
import { ourFileRouter } from "@/app/api/uploadthing/core"; 

export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
  // Opción recomendada para debug:
  // config: { ... }
});