#!/bin/bash
LOGFILE="command_output.log"
echo "" > $LOGFILE  # Clear the log file at the start

while true; do
  read -p "$ " cmd

  # Log the command to the log file
  # echo "Command: $cmd" >> $LOGFILE

  # Execute the command and capture the exit code
  eval "$cmd"
  exit_code=$?

  # Log the exit code to the log file
  echo "$exit_code" >> $LOGFILE

  # # Log the command output to the log file
  # echo "Command Output:" >> $LOGFILE
  # eval "$cmd" 2>&1 | tee -a $LOGFILE
done
