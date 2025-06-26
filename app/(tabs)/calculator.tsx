import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const CalculatorScreen = () => {
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState('');

  const handlePress = (value: string) => {
  if (value === '=') {
    try {
      const evalResult = eval(expression);
      setResult(evalResult.toString());
    } catch (e) {
      setResult('Error');
    }
  } else if (value === 'C') {
    setExpression('');
    setResult('');
  } else if (value === '⌫') {
    setExpression(prev => prev.slice(0, -1));
  } else {
    setExpression(prev => prev + value);
  }
};


  const buttons = [
  ['C', '⌫', '%', '/'],
  ['7', '8', '9', '*'],
  ['4', '5', '6', '-'],
  ['1', '2', '3', '+'],
  ['0', '.', '='],
];


  return (
    <View style={styles.container}>
      <View style={styles.display}>
        <Text style={styles.expression}>{expression}</Text>
        <Text style={styles.result}>{result}</Text>
      </View>
      <View style={styles.buttonContainer}>
        {buttons.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.buttonRow}>
            {row.map((btn, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.button, btn === '=' ? styles.equals : null]}
                onPress={() => handlePress(btn)}
                disabled={!btn}>
                <Text style={styles.buttonText}>{btn}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
};

export default CalculatorScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e1e1e',
    justifyContent: 'flex-end',
    padding: 20,
  },
  display: {
    marginBottom: 20,
  },
  expression: {
    fontSize: 32,
    color: '#fff',
    textAlign: 'right',
  },
  result: {
    fontSize: 24,
    color: '#7FFF00',
    textAlign: 'right',
    marginTop: 10,
  },
  buttonContainer: {
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  button: {
    flex: 1,
    backgroundColor: '#333',
    margin: 5,
    paddingVertical: 20,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 24,
  },
  equals: {
    backgroundColor: '#007bff',
  },
});
