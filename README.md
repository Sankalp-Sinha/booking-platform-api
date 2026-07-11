# Booking Platform API

A RESTful booking platform backend built using NestJS, Prisma ORM, PostgreSQL, and TypeScript.

The application allows authenticated users to manage services and customer bookings. Customers can create bookings without authentication, while booking management and service management endpoints are protected using JWT authentication.

## Features

### Authentication

- User registration
- User login
- JWT access tokens
- Refresh-token rotation
- Hashed refresh-token storage
- Protected routes using a JWT guard

### Service Management

Authenticated users can:

- Create services
- Get all services
- Get a service by ID
- Update services
- Delete services

### Booking Management

- Public customer booking creation
- Get all bookings
- Get booking by ID
- Update booking status
- Cancel booking
- Search bookings
- Filter bookings by status
- Paginate booking results
- Prevent duplicate booking slots

### Additional Features

- Swagger/OpenAPI documentation
- DTO validation using `class-validator`
- Global exception handling
- PostgreSQL database constraints
- Prisma migrations
- Docker and Docker Compose support
- Focused unit tests

## Technology Stack

- NestJS
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT
- bcrypt
- Swagger/OpenAPI
- Docker
- Jest

## Project Structure

```text
src/
├── auth/
│   ├── dto/
│   ├── guards/
│   ├── types/
│   ├── auth.controller.ts
│   ├── auth.module.ts
│   └── auth.service.ts
├── bookings/
│   ├── dto/
│   ├── bookings.controller.ts
│   ├── bookings.module.ts
│   ├── bookings.service.ts
│   └── bookings.service.spec.ts
├── common/
│   └── filters/
├── generated/
│   └── prisma/
├── prisma/
│   ├── prisma.module.ts
│   └── prisma.service.ts
├── services/
│   ├── dto/
│   ├── services.controller.ts
│   ├── services.module.ts
│   └── services.service.ts
├── users/
│   ├── users.module.ts
│   └── users.service.ts
├── app.module.ts
└── main.ts