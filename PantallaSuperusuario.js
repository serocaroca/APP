import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, Button, TextInput, StyleSheet,
  Modal, ScrollView, BackHandler
} from 'react-native';
import {
  collection, getDocs, doc, setDoc, deleteDoc,
  updateDoc, addDoc, serverTimestamp
} from 'firebase/firestore';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { db } from '../firebaseConfig';

export default function PantallaSuperusuario({ route }) {
  const navigation = useNavigation();
  const nickActivo = route?.params?.nick || 'desconocido';

  const [todos, setTodos] = useState([]);
  const [superusuarios, setSuperusuarios] = useState([]);
  const [medicos, setMedicos] = useState([]);
  const [pacientes, setPacientes] = useState([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfirmVisible, setModalConfirmVisible] = useState(false);
  const [modalNuevoPlanVisible, setModalNuevoPlanVisible] = useState(false);

  const [editando, setEditando] = useState(null);
  const [nick, setNick] = useState('');
  const [clave, setClave] = useState('');
  const [rolNuevo, setRolNuevo] = useState(null);

  const [nuevoPlanNombre, setNuevoPlanNombre] = useState('');
  const [pacienteParaNuevoPlan, setPacienteParaNuevoPlan] = useState(null);

  const [verSuperusuarios, setVerSuperusuarios] = useState(false);
  const [verMedicos, setVerMedicos] = useState(false);
  const [verPacientes, setVerPacientes] = useState(true);

  useEffect(() => {
    cargarUsuarios();
  }, []);

  // BOTÓN "ATRÁS" DEL DISPOSITIVO
  useFocusEffect(() => {
    const onBackPress = () => {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }]
      });
      return true;
    };
    BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
  });

  // BOTÓN "ATRÁS" DEL NAVEGADOR
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }]
      });
    };
    window.onpopstate = handler;
    return () => {
      window.onpopstate = null;
    };
  }, []);

  // PERSONALIZAR FLECHITA DEL HEADER
  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity onPress={() => {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }]
          });
        }}>
          <Text style={{ marginLeft: 10, fontSize: 16 }}>⬅️</Text>
        </TouchableOpacity>
      )
    });
  }, [navigation]);
  const cargarUsuarios = async () => {
    const snap = await getDocs(collection(db, 'usuarios'));
    const lista = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setTodos(lista);
    setSuperusuarios(lista.filter(u => u.tipo === 'superusuario'));
    setMedicos(lista.filter(u => u.tipo === 'medico'));
    setPacientes(lista.filter(u => u.tipo === 'paciente'));
  };

  const abrirModalNuevo = (tipo) => {
    setRolNuevo(tipo);
    setNick('');
    setClave('');
    setEditando(null);
    setModalVisible(true);
  };

  const abrirEditor = (usuario) => {
    setEditando(usuario);
    setNick(usuario.nick);
    setClave(usuario.clave);
    setRolNuevo(usuario.tipo);
    setModalVisible(true);
  };

  const guardarUsuario = async () => {
    if (!nick || !clave) return;
    const nickExiste = todos.some(u => u.nick === nick && (!editando || u.id !== editando.id));
    if (nickExiste) return alert('Ya existe un usuario con ese nick.');
    try {
      if (editando) {
        await updateDoc(doc(db, 'usuarios', editando.id), { nick, clave });
      } else {
        const id = Date.now().toString();
        await setDoc(doc(db, 'usuarios', id), {
          id, nick, clave, tipo: rolNuevo
        });
      }
      setModalVisible(false);
      setEditando(null);
      cargarUsuarios();
    } catch (e) {
      alert(e.message);
    }
  };

  const confirmarEliminacion = (usuario) => {
    setEditando(usuario);
    setModalConfirmVisible(true);
  };

  const eliminarUsuario = async () => {
    if (editando) {
      await deleteDoc(doc(db, 'usuarios', editando.id));
      setModalConfirmVisible(false);
      setEditando(null);
      cargarUsuarios();
    }
  };

  const crearNuevoPlan = async () => {
    if (!pacienteParaNuevoPlan || !nuevoPlanNombre.trim()) return;
    try {
      await addDoc(collection(db, `usuarios/${pacienteParaNuevoPlan}/planes`), {
        nombre: nuevoPlanNombre.trim(),
        creadoPor: nickActivo,
        creadoEn: serverTimestamp()
      });
      setModalNuevoPlanVisible(false);
      setNuevoPlanNombre('');
      setPacienteParaNuevoPlan(null);
      cargarUsuarios();
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
            <Text style={{ fontWeight: 'bold' }}>
              {p.creadoEn?.toDate?.().toLocaleDateString?.() || ''} - {p.nombre}
            </Text>
            <Text style={{ fontSize: 12 }}>{p.creadoPor}</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity onPress={() => navigation.navigate('MedicoTratamiento', {
  pacienteId,
  planId: p.id,
  origen: nickActivo,
  nick: p.creadoPor || 'desconocido',
  nombrePlan: p.nombre || 'Sin nombre',
  creadoEn: p.creadoEn?.toDate?.() || new Date()
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
  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.titulo}>👨‍⚕️ Gestión de Pacientes ({nickActivo})</Text>

      {/* PACIENTES */}
      <TouchableOpacity onPress={() => setVerPacientes(!verPacientes)} style={styles.seccionTituloBox}>
        <Text style={styles.seccionTitulo}>👥 Pacientes {verPacientes ? '▼' : '▶'}</Text>
      </TouchableOpacity>
      {verPacientes && (
        <>
          {pacientes.map(p => (
            <View key={p.id} style={styles.pacienteFila}>
              <View style={styles.pacienteBox}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={styles.texto}>{p.nick}</Text>
                  <TouchableOpacity onPress={() => {
                    setPacienteParaNuevoPlan(p.id);
                    setModalNuevoPlanVisible(true);
                  }}>
                    <Text style={styles.botonGris}>➕</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.clave}>{p.clave}</Text>
                <View style={styles.userActions}>
                  <TouchableOpacity onPress={() => abrirEditor(p)}><Text style={styles.boton}>✏️</Text></TouchableOpacity>
                  <TouchableOpacity onPress={() => confirmarEliminacion(p)}><Text style={styles.eliminar}>🗑️</Text></TouchableOpacity>
                </View>
              </View>
              <PlanesDelPaciente pacienteId={p.id} />
            </View>
          ))}
          <Button title="➕ Añadir paciente" onPress={() => abrirModalNuevo('paciente')} />
        </>
      )}

      {/* MÉDICOS */}
      <TouchableOpacity onPress={() => setVerMedicos(!verMedicos)} style={styles.seccionTituloBox}>
        <Text style={styles.seccionTitulo}>👨‍⚕️ Médicos {verMedicos ? '▼' : '▶'}</Text>
      </TouchableOpacity>
      {verMedicos && (
        <>
          {medicos.map(m => (
            <View key={m.id} style={styles.filaUsuario}>
              <View>
                <Text style={styles.texto}>{m.nick}</Text>
                <Text style={styles.clave}>{m.clave}</Text>
              </View>
              <TouchableOpacity onPress={() => abrirEditor(m)}><Text style={styles.boton}>✏️</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => confirmarEliminacion(m)}><Text style={styles.eliminar}>🗑️</Text></TouchableOpacity>
            </View>
          ))}
          <Button title="➕ Añadir médico" onPress={() => abrirModalNuevo('medico')} />
        </>
      )}

      {/* SUPERUSUARIOS */}
      <TouchableOpacity onPress={() => setVerSuperusuarios(!verSuperusuarios)} style={styles.seccionTituloBox}>
        <Text style={styles.seccionTitulo}>🛡️ Superusuarios {verSuperusuarios ? '▼' : '▶'}</Text>
      </TouchableOpacity>
      {verSuperusuarios && (
        <>
          {superusuarios.map(s => (
            <View key={s.id} style={styles.filaUsuario}>
              <View>
                <Text style={styles.texto}>{s.nick}</Text>
                <Text style={styles.clave}>{s.clave}</Text>
              </View>
              <TouchableOpacity onPress={() => abrirEditor(s)}><Text style={styles.boton}>✏️</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => confirmarEliminacion(s)}><Text style={styles.eliminar}>🗑️</Text></TouchableOpacity>
            </View>
          ))}
          <Button title="➕ Añadir superusuario" onPress={() => abrirModalNuevo('superusuario')} />
        </>
      )}
      {/* MODALES */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.subtitulo}>{editando ? 'Editar usuario' : `Nuevo ${rolNuevo}`}</Text>
            <TextInput placeholder="Nick" style={styles.input} value={nick} onChangeText={setNick} autoFocus />
            <TextInput placeholder="Clave" style={styles.input} value={clave} onChangeText={setClave} />
            <Button title="Guardar" onPress={guardarUsuario} />
            <View style={{ marginTop: 10 }}>
              <Button title="Cancelar" color="gray" onPress={() => setModalVisible(false)} />
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={modalConfirmVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.subtitulo}>¿Eliminar usuario?</Text>
            <Text style={{ marginBottom: 10 }}>ID: {editando?.id}</Text>
            <Button title="Eliminar" color="red" onPress={eliminarUsuario} />
            <View style={{ marginTop: 10 }}>
              <Button title="Cancelar" onPress={() => setModalConfirmVisible(false)} />
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={modalNuevoPlanVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.subtitulo}>Nuevo Plan</Text>
            <TextInput
              placeholder="Nombre del plan"
              value={nuevoPlanNombre}
              onChangeText={setNuevoPlanNombre}
              style={styles.input}
              autoFocus
            />
            <Button title="Crear" onPress={crearNuevoPlan} />
            <View style={{ marginTop: 10 }}>
              <Button title="Cancelar" onPress={() => setModalNuevoPlanVisible(false)} />
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  titulo: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  seccionTituloBox: { marginTop: 20 },
  seccionTitulo: { fontSize: 18, fontWeight: 'bold' },
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
  pacienteBox: {
    flex: 1,
    padding: 10
  },
  planBox: {
    flex: 1,
    borderLeftWidth: 1,
    borderLeftColor: '#ccc',
    padding: 10
  },
  planItem: {
    marginBottom: 6,
    padding: 6,
    borderRadius: 6
  },
  planActivo: { backgroundColor: '#d9f9d9' },
  planPasado: { backgroundColor: '#eee' },
  filaUsuario: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    marginBottom: 8,
    backgroundColor: '#fdfdfd'
  },
  userActions: {
    flexDirection: 'row'
  },
  boton: { fontSize: 16, marginHorizontal: 6 },
  botonGris: { fontSize: 16, marginHorizontal: 6, color: '#888' },
  eliminar: { fontSize: 18, color: 'red', marginLeft: 6 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 8, marginBottom: 10 },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 30
  },
  modalBox: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10
  },
  subtitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center'
  }
});




