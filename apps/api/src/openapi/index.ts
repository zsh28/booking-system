import { z } from 'zod'
import { OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi'
import { registry } from './registry'
import {
  registerSchema,
  loginSchema,
  createServiceSchema,
  setAvailabilitySchema,
  dateQuerySchema,
  bookAppointmentSchema
} from '../types/validators'


const errorResponse = z.object({
  error: z.string().or(z.array(z.any()))
})

const registerResponse = z.object({
  message: z.string()
})

const loginResponse = z.object({
  token: z.string()
})

const serviceResponse = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  durationMinutes: z.number()
})

const servicesResponse = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    durationMinutes: z.number(),
    providerName: z.string()
  })
)

const slotsResponse = z.object({
  serviceId: z.string(),
  date: z.string(),
  slots: z.array(
    z.object({
      slotId: z.string(),
      startTime: z.string(),
      endTime: z.string()
    })
  )
})

const appointmentResponse = z.object({
  id: z.string(),
  slotId: z.string(),
  status: z.string()
})

const myAppointmentsResponse = z.array(
  z.object({
    serviceName: z.string(),
    type: z.string(),
    date: z.string(),
    startTime: z.string(),
    endTime: z.string(),
    status: z.string()
  })
)

const providerScheduleResponse = z.object({
  date: z.string(),
  services: z.array(
    z.object({
      serviceId: z.string(),
      serviceName: z.string(),
      appointments: z.array(
        z.object({
          appointmentId: z.string(),
          userName: z.string(),
          startTime: z.string(),
          endTime: z.string(),
          status: z.string()
        })
      )
    })
  )
})

registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT'
})

registry.registerPath({
  method: 'post',
  path: '/auth/register',
  request: {
    body: {
      content: {
        'application/json': {
          schema: registerSchema
        }
      }
    }
  },
  responses: {
    201: {
      description: 'User created',
      content: {
        'application/json': { schema: registerResponse }
      }
    },
    400: {
      description: 'Invalid input',
      content: { 'application/json': { schema: errorResponse } }
    },
    409: {
      description: 'Email already exists',
      content: { 'application/json': { schema: errorResponse } }
    }
  }
})

registry.registerPath({
  method: 'post',
  path: '/auth/login',
  request: {
    body: {
      content: {
        'application/json': {
          schema: loginSchema
        }
      }
    }
  },
  responses: {
    200: {
      description: 'Login success',
      content: {
        'application/json': { schema: loginResponse }
      }
    },
    400: {
      description: 'Invalid input',
      content: { 'application/json': { schema: errorResponse } }
    },
    401: {
      description: 'Invalid credentials',
      content: { 'application/json': { schema: errorResponse } }
    }
  }
})

registry.registerPath({
  method: 'post',
  path: '/services',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: createServiceSchema
        }
      }
    }
  },
  responses: {
    201: {
      description: 'Service created',
      content: { 'application/json': { schema: serviceResponse } }
    },
    400: {
      description: 'Invalid input',
      content: { 'application/json': { schema: errorResponse } }
    },
    403: {
      description: 'Forbidden',
      content: { 'application/json': { schema: errorResponse } }
    }
  }
})

registry.registerPath({
  method: 'post',
  path: '/services/{serviceId}/availability',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ serviceId: z.string() }),
    body: {
      content: {
        'application/json': {
          schema: setAvailabilitySchema
        }
      }
    }
  },
  responses: {
    201: { description: 'Availability set' },
    400: { description: 'Invalid input', content: { 'application/json': { schema: errorResponse } } },
    403: { description: 'Forbidden', content: { 'application/json': { schema: errorResponse } } },
    404: { description: 'Not found', content: { 'application/json': { schema: errorResponse } } },
    409: { description: 'Overlapping availability', content: { 'application/json': { schema: errorResponse } } }
  }
})

registry.registerPath({
  method: 'get',
  path: '/services',
  request: {
    query: z.object({
      type: z.string().optional()
    })
  },
  responses: {
    200: {
      description: 'Service list',
      content: { 'application/json': { schema: servicesResponse } }
    },
    400: { description: 'Invalid type', content: { 'application/json': { schema: errorResponse } } }
  }
})

registry.registerPath({
  method: 'get',
  path: '/services/{serviceId}/slots',
  request: {
    params: z.object({ serviceId: z.string() }),
    query: dateQuerySchema
  },
  responses: {
    200: {
      description: 'Derived slots',
      content: { 'application/json': { schema: slotsResponse } }
    },
    400: { description: 'Invalid date', content: { 'application/json': { schema: errorResponse } } },
    404: { description: 'Service not found', content: { 'application/json': { schema: errorResponse } } }
  }
})

registry.registerPath({
  method: 'post',
  path: '/appointments',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': { schema: bookAppointmentSchema }
      }
    }
  },
  responses: {
    201: { description: 'Appointment booked', content: { 'application/json': { schema: appointmentResponse } } },
    400: { description: 'Invalid slot', content: { 'application/json': { schema: errorResponse } } },
    401: { description: 'Unauthorized', content: { 'application/json': { schema: errorResponse } } },
    403: { description: 'Forbidden', content: { 'application/json': { schema: errorResponse } } },
    409: { description: 'Slot already booked', content: { 'application/json': { schema: errorResponse } } }
  }
})

registry.registerPath({
  method: 'get',
  path: '/appointments/me',
  security: [{ bearerAuth: [] }],
  responses: {
    200: { description: 'My appointments', content: { 'application/json': { schema: myAppointmentsResponse } } },
    401: { description: 'Unauthorized', content: { 'application/json': { schema: errorResponse } } }
  }
})

registry.registerPath({
  method: 'get',
  path: '/providers/me/schedule',
  security: [{ bearerAuth: [] }],
  request: {
    query: dateQuerySchema
  },
  responses: {
    200: { description: 'Provider schedule', content: { 'application/json': { schema: providerScheduleResponse } } },
    401: { description: 'Unauthorized', content: { 'application/json': { schema: errorResponse } } }
  }
})

export const getOpenApiDocument = () => {
  const generator = new OpenApiGeneratorV3(registry.definitions)
  return generator.generateDocument({
    openapi: '3.0.3',
    info: {
      title: 'Appointment Booking API',
      version: '1.0.0'
    },
    servers: [{ url: 'http://localhost:3000' }]
  })
}
