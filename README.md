# PF2E Vision Configuration

A Foundry VTT module for Pathfinder 2nd Edition that adds enhanced vision configuration options for tokens, allowing GMs and players to set precise daylight vision distances in both feet and miles.

## Features

- **Configurable Daylight Vision**: Set vision distances in both feet and miles for precise control
- **Multiple Vision Types**: Support for Normal, Low-Light, Darkvision, Blindsight, and Tremorsense
- **Real-time Calculations**: Automatic conversion and display of total vision range
- **Scene Lighting Integration**: Vision automatically adjusts based on scene lighting conditions
- **Default Settings**: Configurable default values for new tokens
- **User-friendly Interface**: Clean, intuitive token configuration interface

## Installation

1. In Foundry VTT, go to the **Add-on Modules** tab
2. Click **Install Module**
3. Paste the module manifest URL or install manually
4. Enable the module in your world

## Usage

### Token Configuration

1. Right-click on any token and select **Configure Token**
2. Scroll to the **PF2E Vision Configuration** section
3. Set the desired vision parameters:
   - **Daylight Vision Distance (feet)**: Base vision range in feet
   - **Daylight Vision Distance (miles)**: Additional vision range in miles
   - **Vision Type**: Select from Normal, Low-Light, Darkvision, Blindsight, or Tremorsense

### Vision Types

- **Normal Vision**: Standard human vision, affected by lighting conditions
- **Low-Light Vision**: Can see in dim light as if it were bright light
- **Darkvision**: Can see in complete darkness up to the specified range
- **Blindsight**: Can sense surroundings without relying on sight
- **Tremorsense**: Can detect vibrations through the ground

### Module Settings

Configure default values for new tokens in the module settings:
- Default daylight vision distance (feet)
- Default daylight vision distance (miles)
- Default vision type

## Technical Details

- **Compatible with**: Foundry VTT v10+
- **System**: Pathfinder 2nd Edition
- **License**: MIT
- **Version**: 0.01

## How It Works

The module extends Foundry's token configuration system to add custom vision fields. When a token's vision is updated:

1. The total vision range is calculated (feet + miles converted to feet)
2. Vision ranges are adjusted based on the selected vision type
3. Scene lighting conditions are taken into account
4. Token vision is automatically updated in real-time

## Contributing

This module is open source. Feel free to submit issues, feature requests, or pull requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
