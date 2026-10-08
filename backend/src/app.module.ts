import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { MongooseModule } from '@nestjs/mongoose';
import { join } from 'path';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { CartModule } from './cart/cart.module';
import { MenuModule } from './menu/menu.module';
import { OrdersModule } from './orders/orders.module';
import { OutletsModule } from './outlets/outlets.module';
import { PaymentsModule } from './payments/payments.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    // Reads backend/.env into process.env
    ConfigModule.forRoot({ isGlobal: true }),

    // Connects to MongoDB using MONGODB_URI
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>('MONGODB_URI'),
      }),
    }),

    // "Code-first" GraphQL: our TypeScript classes generate schema.gql automatically.
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'schema.gql'),
      sortSchema: true,
      context: ({ req }: { req: unknown }) => ({ req }), // lets guards read the JWT header
      includeStacktraceInErrorResponses: false, // never leak stack traces
      // Turn errors into friendly messages. Errors the USER can fix (HTTP 4xx: bad input,
      // not logged in, forbidden, duplicate email...) keep their message. Anything else
      // (a real bug / database crash) is hidden behind a generic message.
      formatError: (formatted) => {
        const original = formatted.extensions?.originalError as
          { message?: string | string[]; statusCode?: number } | undefined;
        const status = original?.statusCode;
        if (status && status >= 400 && status < 500) {
          const text = Array.isArray(original?.message)
            ? original?.message[0]
            : original?.message;
          const codes: Record<number, string> = {
            400: 'BAD_REQUEST',
            401: 'UNAUTHENTICATED',
            403: 'FORBIDDEN',
            404: 'NOT_FOUND',
            409: 'CONFLICT',
          };
          return {
            message: text || formatted.message,
            extensions: { code: codes[status] || 'BAD_REQUEST' },
          };
        }
        const code = formatted.extensions?.code;
        // GraphQL's own validation errors (e.g. unknown field) are safe to show.
        if (
          code === 'GRAPHQL_VALIDATION_FAILED' ||
          code === 'BAD_USER_INPUT' ||
          code === 'GRAPHQL_PARSE_FAILED'
        ) {
          return { message: formatted.message, extensions: { code } };
        }
        return {
          message: 'Something went wrong on our side. Please try again.',
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        };
      },
    }),

    AuthModule,
    UsersModule,
    OutletsModule,
    MenuModule,
    CartModule,
    OrdersModule,
    PaymentsModule,
    AdminModule,
  ],
})
export class AppModule {}
