
// ColorPicker.js

import React from 'react';

class ColorPicker extends React.Component {
  render() {
    const { colors, onChangeColor } = this.props;
    return (
      <div>
        {colors.map((color, index) => (
          <button
            key={index}
            style={{ backgroundColor: color, height: '20px', width: '20px' }}
            onClick={() => onChangeColor(color)}
          />
        ))}
      </div>
    );
  }
}

export default ColorPicker;
