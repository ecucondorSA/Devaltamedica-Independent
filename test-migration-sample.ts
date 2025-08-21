// Test file for console.log migration
import { SomeModule } from './some-module';

export class TestService {
  constructor() {
    console.log('Service initialized');
  }

  processData(data: any) {
    console.debug('Processing data:', data);
    
    try {
      // Some logic
      console.info('Data processed successfully');
      return data;
    } catch (error) {
      console.error('Error processing data:', error);
      throw error;
    }
  }

  warnUser(message: string) {
    console.warn('Warning:', message);
  }
}