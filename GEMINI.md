# 🏥 GEMINI.md - Clinica Mia Hospital Management System

This document provides a comprehensive overview of the Clinica Mia project, its structure, and development conventions to guide future interactions and development.

## 1. Project Overview

Clinica Mia is a full-stack hospital management system designed as a monorepo containing three distinct projects: a central backend API, an admin-facing frontend, and a user-facing frontend.

### Core Components

*   **Backend (`backend/`)**: A high-performance API built with **Hono.js** on **Node.js**. It manages all business logic, database interactions, and authentication for both frontend applications.
*   **Admin Frontend (`frontend/`)**: A responsive web application for internal staff (admins, doctors, nurses). Built with **Next.js** and **React**, it uses **Tailwind CSS** and **shadcn/ui** for a data-intensive user interface.
*   **User Frontend (`Front_Usuario_ClinicaMia/`)**: A public-facing web application for patients. Also built with **Next.js**, it uses **Bootstrap** and **Sass** for its styling, tailored for a different user experience.
*   **Database**: A single **PostgreSQL** database serves as the source of truth for the entire system. The schema is declaratively managed by **Prisma ORM** in the backend project.
*   **Containerization**: The backend, database, and **admin frontend** are containerized using **Docker** and orchestrated with **Docker Compose**.

## 2. Building and Running the Project

There are two primary methods for running the application.

### Method 1: Docker + Manual (Hybrid Approach)

The `docker-compose.yml` file simplifies running the core services, but the User Frontend must be run manually.

1.  **Start Core Services with Docker:**
    ```bash
    # This command starts the backend, database, and ADMIN frontend.
    docker-compose up -d
    ```

2.  **Run the User Frontend Manually:**
    ```bash
    # Navigate to the user frontend directory
    cd Front_Usuario_ClinicaMia/

    # Install dependencies
    npm install

    # Start the development server
    npm run dev
    ```

**Service URLs:**
*   **Admin Frontend:** [http://localhost:3000](http://localhost:3000)
*   **User Frontend:** [http://localhost:3001](http://localhost:3001)
*   **Backend API:** [http://localhost:4000](http://localhost:4000)

### Method 2: Local Development (Fully Manual)

This method requires you to have Node.js and a running PostgreSQL instance on your local machine.

1.  **Start the Backend:**
    ```bash
    cd backend/
    npm install
    npm run prisma:migrate # Run once or when schema changes
    npm run dev
    ```
    The backend will be running at `http://localhost:4000`.

2.  **Start the Admin Frontend:**
    ```bash
    cd frontend/
    npm install
    npm run dev
    ```
    The admin frontend will be running at `http://localhost:3000`.

3.  **Start the User Frontend:**
    ```bash
    cd Front_Usuario_ClinicaMia/
    npm install
    npm run dev
    ```
    The user frontend will be running at `http://localhost:3001`.

## 3. Key Scripts

### Backend (`backend/`)

*   `npm run dev`: Starts the backend server in development mode.
*   `npm run test`: Runs the test suite using Jest.
*   `npm run prisma:migrate`: Applies pending database schema migrations.
*   `npm run prisma:generate`: Generates the Prisma Client based on the schema.
*   `npm run prisma:studio`: Opens a GUI for the database.

### Admin Frontend (`frontend/`)

*   `npm run dev`: Starts the Next.js development server on port 3000.
*   `npm run build`: Creates a production-ready build.
*   `npm run start`: Starts the production server.

### User Frontend (`Front_Usuario_ClinicaMia/`)

*   `npm run dev`: Starts the Next.js development server on port 3001.
*   `npm run build`: Creates a production-ready build.
*   `npm run start`: Starts the production server.
*   `npm run sync-types`: Generates TypeScript types from the backend's OpenAPI spec.

## 4. Database

The database schema is the heart of the application and is defined in `backend/prisma/schema.prisma`.

*   **Models:** The schema defines numerous models, including `Usuario`, `Paciente`, `Cita`, `Admision`, `Factura`, `EvolucionClinica`, and many more. It is the single source of truth for the entire system's data structure.
*   **Migrations:** To create and apply a migration after changing `schema.prisma`, run `npm run prisma:migrate` in the `backend` directory. This is crucial for keeping the database schema in sync with the application code.

## 5. Development Conventions

*   **Backend Architecture:** The backend follows a service-oriented, 3-layer architecture. Business logic is encapsulated in models/services, which are consumed by the route handlers. This keeps the API layer thin and business logic reusable and testable.
*   **Frontend Architecture:** Both frontends use Next.js.
    *   The **Admin Frontend** uses `shadcn/ui` and `swr` for a data-dense, functional interface.
    *   The **User Frontend** uses `Bootstrap`, `Sass`, and `react-query`, suggesting a more traditional, styled web experience for patients.
*   **Authentication:** The backend issues JWTs (JSON Web Tokens). Both frontends must include the `Authorization: Bearer <token>` header in requests to protected API endpoints.