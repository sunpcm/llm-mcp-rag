export function logSection(title: string, content: string): void {
  console.log('\n' + '='.repeat(50));
  console.log(`${title}:`);
  console.log('-'.repeat(50));
  console.log(content);
  console.log('='.repeat(50) + '\n');
}

export function logError(error: Error, context?: string): void {
  console.error('\n' + '!'.repeat(50));
  if (context) {
    console.error(`Error in ${context}:`);
  }
  console.error(error.message);
  if (error.stack) {
    console.error(error.stack);
  }
  console.error('!'.repeat(50) + '\n');
}

export function logDebug(message: string, data?: any): void {
  if (process.env.NODE_ENV === 'development') {
    console.debug('\n[DEBUG]', message);
    if (data) {
      console.debug(data);
    }
  }
} 