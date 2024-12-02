#!/bin/bash
LOGFILE="command_output.log"
echo "" > $LOGFILE  # Clear the log file at the start

export TERM=xterm-256color

# Function to check if current directory is a Git repository
initialize_git_repo_if_needed() {
  if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo "This is already a Git repository."
  else
    echo "Initializing a new Git repository..."
    git init
    git config user.name Devdock
    git config user.email copilot@devdock.ai
    git add .
    git commit -m "Autocommitted by Devdock 🤘"
    echo "Git repository initialized and all files committed."
  fi

  fix_git_head
}

# Function to fix the HEAD file in the Git repository if it's missing
fix_git_head() {
  if [ ! -f .git/HEAD ]; then
    echo "HEAD file is missing. Creating and fixing HEAD..."
    echo "ref: refs/heads/main" > .git/HEAD
    echo "HEAD fixed to point to 'main' branch."
  else
    echo "HEAD file exists and seems fine."
  fi
}

# Check and initialize Git repo at the start
initialize_git_repo_if_needed

# Create a custom bash RC file
CUSTOM_BASHRC=$(mktemp)
cat << 'EOF' > "$CUSTOM_BASHRC"
HISTFILE=~/.devdock_history
HISTSIZE=1000
HISTFILESIZE=2000

# Custom prompt
PS1='\[\033[01;32m\][Devdock 🤘 \w]\[\033[00m\] \$ '

# Variables for command tracking
CURRENT_COMMAND=""

# Function to handle command execution
function preexec() {
    # Skip if it's a PROMPT_COMMAND
    [[ "$BASH_COMMAND" == "$PROMPT_COMMAND" ]] && return
    
    # Store the current command
    CURRENT_COMMAND=$BASH_COMMAND
}

# Function to execute and log commands
function execute_and_log() {
    # Skip if no command
    [[ -z "$CURRENT_COMMAND" ]] && return
    
    # Skip if it's a shell function
    [[ "$CURRENT_COMMAND" == "execute_and_log" ]] && return
    
    # Execute the command and capture output
    local output
    local exit_code
    
    output=$(eval "$CURRENT_COMMAND" 2>&1)
    exit_code=$?
    
    # Log command and output
    echo "Command: $CURRENT_COMMAND" >> command_output.log
    echo "Output:" >> command_output.log
    echo "$output" >> command_output.log
    echo "Exit Code: $exit_code" >> command_output.log
    echo "----" >> command_output.log
    
    # Clear current command
    CURRENT_COMMAND=""
    
    return $exit_code
}

# Set up command tracking
trap 'preexec' DEBUG
PROMPT_COMMAND='execute_and_log'

# Enable bash features
shopt -s checkwinsize
shopt -s histappend
EOF

# Start bash with custom RC file
exec bash --rcfile "$CUSTOM_BASHRC"

# Cleanup temp file (this won't actually execute due to the exec above)
rm -f "$CUSTOM_BASHRC"