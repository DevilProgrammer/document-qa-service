import * as readline from 'readline'


// create an interface for reading input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

export function getInput(cb){
    rl.question('Enter some text (type "NO" to quit): ', async (input) => {
        // Check if the user wants to quit
        if (input.toUpperCase() === 'NO') {
          rl.close(); // Close the readline interface
          return; // Exit the function
        }
    
        // Process the input
        await cb(input)
        // Prompt for the next input
        getInput(cb);
      });
}