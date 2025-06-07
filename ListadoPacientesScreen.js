// ListadoPacientesScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Button, StyleSheet } from 'react-native';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useNavigation } from '@react-navigation/native';

export default function ListadoPacientesScreen() {
  const [pacientes, setPacientes] = useState([]);
  const [planes, setPlanes] = useState({});
  const navigation = useNavigation();

  const cargarPacientes = async () => {
    try {
      const usuariosRef = collection(db, 'usuarios');
      const snapshot = await getDocs(usuariosRef);
      const lista = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(user => user.tipo === 'paciente');
      setPacientes(lista);

      // cargar planes por paciente
      const planesPorPaciente = {};
      for (const paciente of lista) {
        const planesRef = collection(db, 'usuarios', paciente.id, 'planes');
        const planesSnap = await getDocs(planesRef);
        const planesList = planesSnap.docs.map(p => ({ id: p.id, ...p.data() }));
        if (planesList.length > 0) {
          planesList.sort((a, b) => (b.fechaCreacion?.seconds || 0) - (a.fechaCreacion?.seconds || 0));
          planesPorPaciente[paciente.id] = {
            total: planesList.length,
            ultimo: planesList[0].nombre || 'Plan sin nombre'
          };
        }
      }
      setPlanes(planesPorPaciente);

    } catch (error) {
      console.error('Error cargando pacientes o planes:', error);
    }
  };

  useEffect(() => {
    cargarPacientes();
  }, []);

  const seleccionarPaciente = (paciente) => {
    navigation.navigate('MedicoTratamiento', { paciente });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Pacientes</Text>
      <FlatList
        data={pacientes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const info = planes[item.id];
          return (
            <TouchableOpacity onPress={() => seleccionarPaciente(item)}>
              <View style={styles.pacienteCard}>
                <Text style={styles.nombre}>{item.nombre}</Text>
                {info ? (
                  <Text style={styles.planInfo}>
                    {info.total} plan(es) • Último: {info.ultimo}
                  </Text>
                ) : (
                  <Text style={styles.planInfo}>Sin planes aún</Text>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
      />
      <Button title="➕ Añadir nueva paciente" onPress={() => navigation.navigate('AltaPaciente')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  titulo: { fontSize: 22, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  pacienteCard: {
    backgroundColor: '#e6f7ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10
  },
  nombre: { fontSize: 16, fontWeight: 'bold' },
  planInfo: { fontSize: 13, color: '#555' }
});
