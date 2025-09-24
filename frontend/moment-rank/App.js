import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button, TextInput } from 'react-native';
import { useState } from 'react'

export default function Login() {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const handleName = (text) => {
    setName(text);
  }
  const handlePassword = (text) => {
    setPassword(text);
  }
  
  return (
    <View style={styles.container}>
      <Text>Login</Text>
      <StatusBar style="auto" />
      <TextInput 
        onChangeText={handleName}
        placeholder='name' 
        value={name} 
        style={styles.input} 
        />
      <TextInput 
        onChangeText={handlePassword}
        placeholder='password' 
        value={password} 
        style={styles.input}
        />
      <Button title= "login" ></Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    width: '60%',
    borderColor: 'grey',
    borderWidth: 1,
    margin: 10,
    fontSize: 18,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
});
