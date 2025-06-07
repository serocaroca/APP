// AltaPacienteScreen.js
import React, { useState } from 'react';
import { View, TextInput, Button, Text, Alert, StyleSheet } from 'react-native';
import { db } from '../firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';

export default function AltaPacienteScreen() {
  const [nick, setNick] = useState('');
  const [codigo, setCodigo] = useState('');

  const registrarPaciente = async () => {
    if (!nick || !codigo) {
      Alert.alert('Campos incompletos', 'Debes rellenar todos los campos.');
      return;
    }

    try {
      const id = Date.now().toString(); // ID único sencillo (podemos usar UUID si prefieres)
      await setDoc(doc(db, 'usuarios', id), {
        id,
        nick,
        codigo,
        tipo: 'paciente'
      });
      Alert.alert('Éxito', 'Paciente registrado correctamente.');
      setNick('');
      setCodigo('');
    } catch (error) {
      Alert.alert('Error al registrar', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Alta de Paciente</Text>
      <TextInput
        placeholder="Nick identificativo"
        style={styles.input}
        value={nick}
        onChangeText={setNick}
      />
      <TextInput
        placeholder="Código de acceso (secreto)"
        style={styles.input}
        value={codigo}
        onChangeText={setCodigo}
        secureTextEntry
      />
      <Button title="Registrar Paciente" onPress={registrarPaciente} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  titulo: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15
  }
});
