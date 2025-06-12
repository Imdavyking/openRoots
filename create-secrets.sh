#!/bin/bash

create_secrets() {
  local dir="$1"
  echo "Entering $dir/ and creating secrets..."

  cd "$dir" || { echo "Failed to enter $dir"; exit 1; }

  # Ensure secrets/ directory exists
  mkdir -p secrets  

  # Ensure secrets/ is in .gitignore
  if [ ! -f ".gitignore" ]; then
    touch ".gitignore"
  fi

  if ! grep -qx "secrets/" ".gitignore"; then
    echo "secrets/" >> ".gitignore"
    echo "Added 'secrets/' to $dir/.gitignore"
  fi

  # Process the .env file and create secrets
 # Process the .env file and create secrets
  while IFS='=' read -r key value || [ -n "$key" ]; do
    # Skip comments or blank lines
    [[ "$key" =~ ^#.*$ || -z "$key" ]] && continue

    key=$(echo "$key" | xargs)
    # Remove anything after '#' in the value (the comment)
    value=$(echo "$value" | sed 's/\s*#.*//' | xargs)

    echo "$value" > "secrets/$key"

    if docker secret ls --format '{{.Name}}' | grep -qx "$key"; then
      echo "Updating secret $key..."
      docker secret rm "$key" >/dev/null 2>&1
    fi

    docker secret create "$key" "secrets/$key" \
      && echo "Secret $key created successfully!" \
      || echo "Failed to create secret: $key"
  done < .env


  cd - > /dev/null || exit
}

# Run the function for backend
create_secrets "backend"

echo "Script execution completed!"
