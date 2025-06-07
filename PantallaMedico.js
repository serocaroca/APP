import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, Button, StyleSheet,
  ScrollView, BackHandler
} from 'react-native';
import {
  collection, getDocs, doc, deleteDoc,
  addDoc, serverTimestamp
} from 'firebase/firestore';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { db } from '../firebaseConfig';

export default function PantallaMedico({ route }) {
  const navigation = useNavigation();
  const nickActivo = route?.params?.nick || 'desconocido';

  const [pacientes, setPacientes] = useState([]);
  const [nuevoPlanNombre, setNuevoPlanNombre] = useState('');
  const [pacienteParaNuevoPlan, setPacienteParaNuevoPlan] = useState(null);

  useEffect(() => {
    cargarPacientes();
  }, []);

  const cargarPacientes = async () => {
    const snap = await getDocs(collection(db, 'usuarios'));
    const lista = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const soloPacientes = lista.filter(u => u.tipo === 'paciente');
    setPacientes(soloPacientes);
  };
  const crearNuevoPlan = async () => {
    if (!pacienteParaNuevoPlan || !nuevoPlanNombre.trim()) return;
    try {
      await addDoc(collection(db, `usuarios/${pacienteParaNuevoPlan}/planes`), {
        nombre: nuevoPlanNombre.trim(),
        creadoPor: nickActivo,
        creadoEn: serverTimestamp()
      });
      setNuevoPlanNombre('');
      setPacienteParaNuevoPlan(null);
      cargarPacientes();
    } catch (e) {
      alert('Error al crear el plan: ' + e.message);
    }
  };

  const PlanesDelPaciente = ({ pacienteId }) => {
    const [planes, setPlanes] = useState([]);

    useEffect(() => {
      const cargar = async () => {
        const snap = await getDocs(collection(db, `usuarios/${pacienteId}/planes`));
        const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        lista.sort((a, b) => (a.creadoEn?.seconds || 0) - (b.creadoEn?.seconds || 0));
        setPlanes(lista);
      };
      cargar();
    }, [pacienteId]);

    return (
      <View style={styles.planBox}>
        {planes.map((p, i) => (
          <View key={p.id} style={[styles.planItem, i === planes.length - 1 ? styles.planActivo : styles.planPasado]}>
            <Text style={{ fontWeight: 'bold' }}>{p.creadoEn?.toDate?.().toLocaleDateString?.() || ''} - {p.nombre}</Text>
            <Text style={{ fontSize: 12 }}>{p.creadoPor}</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity onPress={() => navigation.navigate('MedicoTratamiento', {
                pacienteId,
                planId: p.id,
                nick: nickActivo
              })}>
                <Text style={styles.boton}>📂</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={async () => {
                await deleteDoc(doc(db, `usuarios/${pacienteId}/planes`, p.id));
                setPlanes(planes.filter(pl => pl.id !== p.id));
              }}>
                <Text style={styles.eliminar}>🗑️</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    );
  };

  useFocusEffect(
    useCallback(() => {
      const bloquearAtras = () => {
        navigation.replace('Login');
        return true;
      };

      const sub = BackHandler.addEventListener('hardwareBackPress', bloquearAtras);
      return () => sub.remove();
    }, [navigation])
  );

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.titulo}>👨‍⚕️ Gestión de Pacientes ({nickActivo})</Text>

      {pacientes.map(p => (
        <View key={p.id} style={styles.pacienteFila}>
          <View style={styles.pacienteBox}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={styles.texto}>{p.nick}</Text>
              <TouchableOpacity onPress={() => {
                setPacienteParaNuevoPlan(p.id);
                setNuevoPlanNombre('');
              }}>
                <Text style={styles.botonGris}>➕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.clave}>{p.clave}</Text>
          </View>
          <PlanesDelPaciente pacienteId={p.id} />
        </View>
      ))}

      <Button title="➕ Añadir paciente" onPress={() => navigation.navigate('AltaPaciente')} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  titulo: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  texto: { fontSize: 16, fontWeight: 'bold' },
  clave: { fontSize: 14, color: '#555', marginBottom: 4 },
  pacienteFila: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#fff'
  },
  pacienteBox: { flex: 1, padding: 10 },
  planBox: {
    flex: 1,
    borderLeftWidth: 1,
    borderLeftColor: '#ccc',
    padding: 10
  },
  planItem: { marginBottom: 6, padding: 6, borderRadius: 6 },
  planActivo: { backgroundColor: '#d9f9d9' },
  planPasado: { backgroundColor: '#eee' },
  boton: { fontSize: 16, marginHorizontal: 6 },
  botonGris: { fontSize: 16, marginHorizontal: 6, color: '#888' },
  eliminar: { fontSize: 18, color: 'red', marginLeft: 6 }
});

