#!/bin/bash

# Year Glance Plugin Installer
# Copies plugin files to an Obsidian vault

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLUGIN_NAME="year-glance"

# Check if destination was provided as argument
if [ -n "$1" ]; then
    VAULT_PATH="$1"
else
    # Prompt for vault path
    echo "Enter the path to your Obsidian vault:"
    read -r VAULT_PATH
fi

# Expand ~ if present
VAULT_PATH="${VAULT_PATH/#\~/$HOME}"

# Validate vault path
if [ ! -d "$VAULT_PATH" ]; then
    echo "Error: Directory does not exist: $VAULT_PATH"
    exit 1
fi

# Check if it looks like an Obsidian vault
if [ ! -d "$VAULT_PATH/.obsidian" ]; then
    echo "Warning: No .obsidian folder found. Is this an Obsidian vault?"
    read -p "Continue anyway? [y/N] " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Create plugins directory if needed
PLUGINS_DIR="$VAULT_PATH/.obsidian/plugins"
mkdir -p "$PLUGINS_DIR"

# Create plugin directory
DEST_DIR="$PLUGINS_DIR/$PLUGIN_NAME"
mkdir -p "$DEST_DIR"

# Build first if main.js doesn't exist
if [ ! -f "$SCRIPT_DIR/main.js" ]; then
    echo "Building plugin..."
    npm run build --prefix "$SCRIPT_DIR"
fi

# Copy files
echo "Installing to: $DEST_DIR"
cp "$SCRIPT_DIR/main.js" "$DEST_DIR/"
cp "$SCRIPT_DIR/manifest.json" "$DEST_DIR/"
cp "$SCRIPT_DIR/styles.css" "$DEST_DIR/"

echo "Done! Restart Obsidian and enable '$PLUGIN_NAME' in Settings > Community plugins."
