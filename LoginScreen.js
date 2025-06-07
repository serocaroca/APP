import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export default function LoginScreen({ navigation }) {
  const [nick, setNick] = useState('');
  const [clave, setClave] = useState('');

  const iniciarSesion = async () => {
    if (!nick || !clave) {
      Alert.alert('Error', 'Debes ingresar nick y clave');
      return;
    }

    try {
      const snapshot = await getDocs(collection(db, 'usuarios'));
      const usuarios = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const usuario = usuarios.find(u => u.nick === nick && u.clave === clave);

      if (!usuario) {
        Alert.alert('Error', 'Credenciales incorrectas');
        return;
      }

      // ✅ Corregido: se pasa el nick en todos los casos
      if (usuario.tipo === 'superusuario') {
        navigation.navigate('PantallaSuperusuario', { nick: usuario.nick });
      } else if (usuario.tipo === 'medico') {
        navigation.navigate('PantallaMedico', { nick: usuario.nick });
      } else if (usuario.tipo === 'paciente') {
        navigation.navigate('PantallaPaciente', { nick: usuario.nick });
      } else {
        Alert.alert('Error', 'Tipo de usuario no válido');
      }
    } catch (error) {
      Alert.alert('Error', 'Error al iniciar sesión: ' + error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Iniciar sesión</Text>
      <TextInput
        placeholder="Nick"
        value={nick}
        onChangeText={setNick}
        style={styles.input}
      />
      <TextInput
        placeholder="Clave"
        value={clave}
        onChangeText={setClave}
        secureTextEntry
        style={styles.input}
      />
      <Button title="Entrar" onPress={iniciarSesion} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center'
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10
  }
});
