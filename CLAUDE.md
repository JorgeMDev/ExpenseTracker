# ExpenseTracker Guide

## Project Overview
Aplicación de gestión financiera personal. La app se conecta a APIs bancarias (Plaid) para sincronizar transacciones, categorizar gastos automáticamente (Business/Personal) mediante reglas y lógica de negocio, sugiere deducciones fiscales, y genera reportes financieros detallados.

## Tech Stack
- **Frontend:** NextJs, Tailwind CSS, Headless UI.
- **Backend:** Node.js, Express.
- **Database:** PostgressSQl.
- **Integraciones:** API Bancaria (Plaid), JWT para autenticación.

## Core Workflows
- **Instalar:** `npm install` (ejecutar en root, client y server).
- **Desarrollo:** `npm run dev` (utiliza concurrently para levantar ambos entornos).
- **Testing:** `npm test` para validación de lógica de categorización.
- **Build:** `npm run build`.

## Architecture & Coding Rules
- **Security First:** Nunca imprimir objetos de transacciones bancarias completas en consola. Solo loguear IDs o errores sanitizados.
- **Controllers:** La lógica de conexión con el banco debe estar aislada en `server/services/bankService.js`.
- **Categorización:** El motor de reglas debe ser extensible. Preferir el uso de diccionarios de mapeo antes que IFs anidados.
- **State Management:** Usar React Context para el estado global del usuario y transacciones.
- **CORS:** Configuración estricta de dominios permitidos en producción.

## Data Schema Rules (PostgreSQL)
- Las transacciones deben tener un `transaction_id` único proveniente del banco para evitar duplicados.
- Categorías: Usar un sistema de categorías predefinidas con posibilidad de "Custom Tags" por el usuario.
- Siempre incluir `created_at` y `updated_at` (DEFAULT NOW()) en todas las tablas.
- ORM: usar `pg` (node-postgres) con queries SQL directas. No usar Mongoose ni MongoDB.

## Personal Preferences & Constraints
- **Domain Focus:** Mantener las respuestas estrictamente técnicas (código, arquitectura, seguridad). No proporcionar consejos de inversión o finanzas personales.
- **API Design:** Seguir el estándar REST. Todas las respuestas de error deben incluir un código de error interno para debugging.
- **UI/UX:** Diseño minimalista y oscuro (Dark Mode por defecto). Priorizar la visualización de datos con gráficos limpios.
- **UI/UX:** USE FRAMER MOTION
