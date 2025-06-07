import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ImageBackground,
  TouchableOpacity, Modal, TextInput
} from 'react-native';
import CalendarioMensual from './CalendarioMensualRosa';
import { db } from '../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { format, parseISO, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';

export default function VerPlan({ route }) {
  const { pacienteId, planId } = route.params;
  const [tratamientos, setTratamientos] = useState([]);
  const [nombrePlan, setNombrePlan] = useState('');
  const [creadoPor, setCreadoPor] = useState('');
  const [creadoEn, setCreadoEn] = useState(null);
  const [nickPaciente, setNickPaciente] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);
  const [vistaExtendida, setVistaExtendida] = useState(false);

  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({ headerShown: false });

    const cargarDatos = async () => {
      try {
        const usuarioRef = doc(db, 'usuarios', pacienteId);
        const usuarioSnap = await getDoc(usuarioRef);
        if (usuarioSnap.exists()) {
          setNickPaciente(usuarioSnap.data().nick || '');
        }

        const planRef = doc(db, `usuarios/${pacienteId}/planes/${planId}`);
        const planSnap = await getDoc(planRef);
        if (planSnap.exists()) {
          const datos = planSnap.data();
          setTratamientos(datos.tratamientos || []);
          setNombrePlan(datos.nombre || 'Sin nombre');
          setCreadoPor(datos.creadoPor || 'Desconocido');
          setCreadoEn(datos.creadoEn?.toDate?.() || null);
        }
      } catch (error) {
        console.log('Error al cargar plan:', error);
      }
    };

    cargarDatos();
  }, []);

  const fechaBonita = creadoEn
    ? format(creadoEn, 'dd-MM-yyyy', { locale: es })
    : 'Fecha desconocida';

  const toggleDia = (day) => {
    if (!day?.dateString) return;
    if (diaSeleccionado === day.dateString) {
      setModalVisible(false);
      setDiaSeleccionado(null);
    } else {
      setDiaSeleccionado(day.dateString);
      setModalVisible(true);
    }
  };

  const tratamientosDelDia = (fecha) =>
    tratamientos.filter(t =>
      t.desde && t.hasta && fecha >= t.desde && fecha <= t.hasta
    );

  const obtenerRango = () => {
    const fechasValidas = tratamientos
      .flatMap(t => [t.desde, t.hasta])
      .filter(f => !!f)
      .sort();

    if (fechasValidas.length < 2) return [];

    const inicio = parseISO(fechasValidas[0]);
    const fin = parseISO(fechasValidas[fechasValidas.length - 1]);

    return eachDayOfInterval({ start: inicio, end: fin });
  };

  const actualizarHora = async (i, turno, valor) => {
    try {
      const copia = [...tratamientos];
      if (!copia[i].horas) copia[i].horas = { manana: '', tarde: '', noche: '' };
      copia[i].horas[turno] = valor;
      setTratamientos(copia);

      const planRef = doc(db, `usuarios/${pacienteId}/planes/${planId}`);
      await updateDoc(planRef, { tratamientos: copia });
    } catch (e) {
      console.error('Error actualizando horas:', e.message);
    }
  };

  const mostrarHora = (frec, pos) => frec?.split?.('-')?.[pos] === '1';

  return (
    <ImageBackground
      source={require('../assets/fondo_rosado.png')}
      style={styles.fondo}
      resizeMode="cover"
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.encabezadoNuevo}>
          <View style={{ flex: 1 }}>
            <Text style={styles.nombrePaciente}>👩‍🦰 {nickPaciente}</Text>
            <Text style={styles.lineaInfo}>📋 Plan: {nombrePlan}</Text>
            <Text style={styles.lineaInfo}>📅 Fecha: {fechaBonita}</Text>
            <Text style={styles.lineaInfo}>🧑‍⚕️ Médico: {creadoPor}</Text>
          </View>
          <TouchableOpacity
            onPress={async () => {
              try {
                const planRef = doc(db, `usuarios/${pacienteId}/planes/${planId}`);
                await updateDoc(planRef, { tratamientos });
                navigation.navigate('PantallaPaciente', { nick: nickPaciente });
              } catch (e) {
                console.error('Error al guardar al salir:', e.message);
              }
            }}
            style={styles.botonGoBack}
          >
            <Text style={styles.textoBotonGoBack}>⬅️ Volver</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => setVistaExtendida(!vistaExtendida)} style={styles.botonAlternar}>
          <Text style={styles.botonTexto}>
            {vistaExtendida ? '🗓️ Ver Calendario' : '📋 Vista diaria'}
          </Text>
        </TouchableOpacity>

        {!vistaExtendida ? (
          tratamientos.length > 0 ? (
            <View style={styles.cardCalendario}>
              <ScrollView style={{ flex: 1 }}>
                <CalendarioMensual tratamientos={tratamientos} onDayPress={toggleDia} />
              </ScrollView>
            </View>
          ) : (
            <Text style={{ textAlign: 'center', marginTop: 30 }}>No hay tratamientos cargados.</Text>
          )
        ) : (
          <View style={styles.cardCalendario}>
            <ScrollView>
              {obtenerRango().map((dia, i) => {
                const fechaStr = format(dia, 'yyyy-MM-dd');
                const lista = tratamientosDelDia(fechaStr);

                return (
                  <View key={i} style={styles.lineaDia}>
                    <Text style={styles.diaTitulo}>
                      {format(dia, 'dd-MM-yyyy', { locale: es })}:
                    </Text>
                    {lista.length === 0 ? (
                      <Text style={styles.sinMed}>Sin medicación</Text>
                    ) : (
                      lista.map((t, j) => (
                        <Text key={j} style={styles.detalle}>
                          💊 {t.medicamento} — {t.dosis} — {t.frecuencia}
                        </Text>
                      ))
                    )}
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}

        <View style={styles.lista}>
          {tratamientos.map((t, i) => (
            <View key={i} style={styles.item}>
              <Text style={styles.medicamento}>💊 {t.medicamento} ({t.dosis})</Text>
              <View style={styles.filaHoras}>
                {['manana', 'tarde', 'noche'].map((turno, idx) => (
                  <View key={turno} style={styles.columna}>
                    <Text style={styles.turno}>{turno}</Text>
                    <TextInput
                      style={[
                        styles.inputHora,
                        !mostrarHora(t.frecuencia, idx) && styles.inputDesactivado
                      ]}
                      value={t.horas?.[turno] || ''}
                      editable={mostrarHora(t.frecuencia, idx)}
                      placeholder={mostrarHora(t.frecuencia, idx) ? 'hh:mm' : '—'}
                      onChangeText={(valor) => actualizarHora(i, turno, valor)}
                    />
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>

        {modalVisible && diaSeleccionado && (
          <Modal visible={modalVisible} transparent animationType="fade">
            <View style={styles.modalFondo}>
              <View style={styles.modalBox}>
                <Text style={styles.modalTitulo}>
                  Medicación para el {format(parseISO(diaSeleccionado), 'dd-MM-yyyy', { locale: es })}
                </Text>

                {tratamientosDelDia(diaSeleccionado).length === 0 ? (
                  <Text style={styles.sinMed}>Sin medicación</Text>
                ) : (
                  tratamientosDelDia(diaSeleccionado).map((t, i) => {
                    const horas = t.horas || {};
                    const confirmadas = t.confirmaciones?.[diaSeleccionado];
                    return (
                      <View key={i} style={styles.fichaMed}>
                        <Text style={styles.medNombre}>💊 {t.medicamento} ({t.dosis})</Text>
                        {['manana', 'tarde', 'noche'].map((turno, idx) =>
                          t.frecuencia?.split?.('-')?.[idx] === '1' ? (
                            <Text key={turno} style={styles.horaToma}>🕒 {turno}: {horas[turno] || 'no indicado'}</Text>
                          ) : null
                        )}
                        {confirmadas ? (
                          <Text style={styles.confirmado}>✅ Confirmado a las {confirmadas}</Text>
                        ) : (
                          <TouchableOpacity
                            style={styles.botonConfirmar}
                            onPress={async () => {
                              try {
                                const copia = [...tratamientos];
                                if (!copia[i].confirmaciones) copia[i].confirmaciones = {};
                                const horaAhora = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                                copia[i].confirmaciones[diaSeleccionado] = horaAhora;
                                setTratamientos(copia);
                                const planRef = doc(db, `usuarios/${pacienteId}/planes/${planId}`);
                                await updateDoc(planRef, { tratamientos: copia });
                              } catch (e) {
                                console.error('Error al confirmar toma:', e.message);
                              }
                            }}
                          >
                            <Text style={styles.botonTexto}>Toma confirmada</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })
                )}

                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.botonCerrar}>
                  <Text style={styles.botonTexto}>Cerrar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, width: '100%', height: '100%' },
  container: { padding: 20, paddingBottom: 80 },
  encabezadoNuevo: {
    backgroundColor: '#ffe6f0',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap'
  },
  nombrePaciente: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#b0006d',
    marginBottom: 6
  },
  lineaInfo: {
    fontSize: 14,
    color: '#6a1b9a',
    marginBottom: 2
  },
  botonGoBack: {
    backgroundColor: '#e1bee7',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginTop: 4
  },
  textoBotonGoBack: {
    fontWeight: 'bold',
    color: '#4a148c'
  },
  botonAlternar: {
    backgroundColor: '#f8bbd0',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 14
  },
  botonTexto: {
    fontWeight: 'bold',
    color: '#880e4f'
  },
  cardCalendario: {
    height: 560,
    backgroundColor: '#ffe9f0',
    borderRadius: 16,
    padding: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 24,
    overflow: 'hidden'
  },
  lista: { marginTop: 20 },
  item: {
    backgroundColor: '#fff4fa',
    padding: 10,
    borderRadius: 10,
    marginBottom: 16
  },
  medicamento: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 6,
    color: '#880e4f'
  },
  filaHoras: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  columna: {
    alignItems: 'center',
    flex: 1
  },
  turno: {
    fontSize: 12,
    marginBottom: 4
  },
  inputHora: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 6,
    borderRadius: 6,
    width: '90%',
    textAlign: 'center'
  },
  inputDesactivado: {
    backgroundColor: '#eee',
    color: '#aaa'
  },
  modalFondo: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 30
  },
  modalBox: {
    backgroundColor: '#fffdfd',
    padding: 20,
    borderRadius: 14
  },
  modalTitulo: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 14,
    textAlign: 'center',
    color: '#880e4f'
  },
  fichaMed: {
    backgroundColor: '#fff0f5',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10
  },
  medNombre: {
    fontWeight: 'bold',
    color: '#6a1b9a',
    fontSize: 14,
    marginBottom: 4
  },
  horaToma: {
    fontSize: 13,
    color: '#555',
    marginLeft: 6
  },
  confirmado: {
    color: 'green',
    fontSize: 13,
    marginTop: 6,
    fontStyle: 'italic'
  },
  botonConfirmar: {
    backgroundColor: '#f48fb1',
    padding: 6,
    borderRadius: 6,
    marginTop: 8,
    alignItems: 'center'
  },
  botonCerrar: {
    backgroundColor: '#ccc',
    padding: 8,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center'
  },
  lineaDia: { marginBottom: 10 },
  diaTitulo: { fontWeight: 'bold', marginBottom: 4, color: '#6a1b9a' },
  sinMed: { fontStyle: 'italic', color: '#999' },
  detalle: { fontSize: 14, color: '#444' }
});

