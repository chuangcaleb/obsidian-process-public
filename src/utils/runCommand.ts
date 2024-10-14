import {
  ChildProcessWithoutNullStreams
} from "child_process";

export function runCommand(childProcess: ChildProcessWithoutNullStreams) {
  childProcess.stdout.on("data", (data) => {
    console.log(`stdout:\n${data}`);
  });

  childProcess.stderr.on("data", (data) => {
    console.error(`stderr: ${data}`);
  });

  childProcess.on("error", (error) => {
    console.error(`error: ${error.message}`);
  });

  childProcess.on("close", (code) => {
    console.log(`child process exited with code ${code}`);
  });
}
