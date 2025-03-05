#!/bin/bash
# This script gathers projects with "lint", "test", and "build" targets.
# It uses "npx nx show projects" to list all projects,
# then for each project it checks its targets with "npx nx show project {PROJECT} --json"
# and uses jq to extract the target names.

# Initialize arrays for each target type
lint_projects=()
test_projects=()
build_projects=()

# Get the list of all projects (one project per line)
projects=$(npx nx show projects)

# Process each project
while read -r project; do
  # Skip empty lines
  [ -z "$project" ] && continue
  
  # Get the list of targets for the current project
  targets=$(npx nx show project "$project" --json | jq -r '.targets | to_entries[] | .key')
  
  # If the target list contains "lint", "test", or "build", add the project to the appropriate array
  if echo "$targets" | grep -Fxq "lint"; then
    lint_projects+=("$project")
  fi
  if echo "$targets" | grep -Fxq "test"; then
    test_projects+=("$project")
  fi
  if echo "$targets" | grep -Fxq "build"; then
    build_projects+=("$project")
  fi
done <<< "$projects"

# Convert the Bash arrays to JSON lists using jq.
# Each printf prints one project per line, then jq reads all lines and outputs a JSON array.
lint_json=$(printf '%s\n' "${lint_projects[@]}" | jq -R -s -c 'split("\n") | map(select(length > 0))')
test_json=$(printf '%s\n' "${test_projects[@]}" | jq -R -s -c 'split("\n") | map(select(length > 0))')
build_json=$(printf '%s\n' "${build_projects[@]}" | jq -R -s -c 'split("\n") | map(select(length > 0))')

# Output the three JSON lists (each on its own line)
echo "$lint_json"
echo "$test_json"
echo "$build_json"