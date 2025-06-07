import React, { useState, useEffect } from 'react';
import {
  View, TextInput, TouchableOpacity, Text, ScrollView, Button, StyleSheet, Platform
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import CalendarioMensual from './CalendarioMensual';
import {
  doc, getDoc, updateDoc, collection,
  getDocs, addDoc, deleteDoc
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

let DatePickerWeb;
if (Platform.OS === 'web') {
  DatePickerWeb = require('react-datepicker').default;
  require('react-datepicker/dist/react-datepicker.css');
}

const coloresDisponibles = [
  '#FF8A80', '#FFD180', '#8C9EFF', '#80D8FF', '#CCFF90',
  '#A7FFEB', '#FFB74D', '#BA68C8', '#4DB6AC', '#F06292'
];

export default function MedicoTratamientoScreen({ route, navigation }) {
  const { pacienteId, planId, origen, nick, nombrePlan, creadoEn } = route.params;

  const [tratamientos, setTratamientos] = useState([]);
  const [sugerencias, setSugerencias] = useState([]);
  const [campoActivo, setCampoActivo] = useState([]);
  const [colorPickerIndex, setColorPickerIndex] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [fechaIndex, setFechaIndex] = useState(null);
  const [modoFecha, setModoFecha] = useState('desde');
  const [textoMed, setTextoMed] = useState([]);

  useEffect(() => {
    const cargar = async () => {
      const snap = await getDoc(doc(db, `usuarios/${pacienteId}/planes`, planId));
      if (snap.exists()) {
        const data = snap.data().tratamientos || [];
        setTratamientos(data);
        setTextoMed(data.map(t => t.medicamento || ''));
      }

      const medSnap = await getDocs(collection(db, 'medicamentos'));
      setSugerencias(medSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    cargar();
  }, []);

  const formatFecha = (fecha) =>
    fecha ? format(new Date(fecha), 'dd-MM-yyyy', { locale: es }) : '';

  const actualizarCampo = (index, campo, valor) => {
    const copia = [...tratamientos];
    copia[index][campo] = valor;
    setTratamientos(copia);
  };

  const seleccionarMedicamento = (med, index) => {
    const copia = [...tratamientos];
    copia[index] = {
      ...copia[index],
      medicamento: med.nombre,
      dosis: med.dosis,
      unidad: med.unidad,
      tolerancia: med.tolerancia
    };
    setTratamientos(copia);
    const textos = [...textoMed];
    textos[index] = med.nombre;
    setTextoMed(textos);
    const activo = [...campoActivo];
    activo[index] = false;
    setCampoActivo(activo);
  };

  const borrarMedicamento = async (id) => {
    await deleteDoc(doc(db, 'medicamentos', id));
    setSugerencias(prev => prev.filter(m => m.id !== id));
  };

  const guardarYSalir = async () => {
    await updateDoc(doc(db, `usuarios/${pacienteId}/planes`, planId), { tratamientos });
    const nuevos = tratamientos.filter(t => !sugerencias.some(s =>
      (s.nombre || '').toLowerCase() === (t.medicamento || '').toLowerCase()));
    await Promise.all(nuevos.map(t => addDoc(collection(db, 'medicamentos'), t)));
    navigation.replace(origen === 'medico' ? 'PantallaMedico' : 'PantallaSuperusuario', { nick: origen });
  };

  const handleConfirmFecha = (date) => {
    if (fechaIndex !== null) {
      const campo = modoFecha;
      actualizarCampo(fechaIndex, campo, format(date, 'yyyy-MM-dd'));
      setFechaIndex(null);
    }
  };

  const coloresUsados = tratamientos.map(t => t.color);
  const coloresDisponiblesFiltrados = (index) =>
    coloresDisponibles.filter(c => !coloresUsados.includes(c) || c === tratamientos[index]?.color);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={guardarYSalir}><Text>⬅️</Text></TouchableOpacity>
        <Text>👤 {nick} | 📋 {nombrePlan} | 🗓️ {formatFecha(creadoEn)}</Text>
      </View>

      <View style={styles.card}>
        <ScrollView>
          <CalendarioMensual tratamientos={tratamientos}/>
        </ScrollView>
      </View>

      <View style={styles.cardMedicacion}>
        <Text style={styles.title}>💊 Medicación</Text>
        <Button title="➕ Añadir medicación" onPress={() => {
          setTratamientos([...tratamientos, {
            medicamento:'', dosis:'', unidad:'mg', tolerancia:'00:00',
            desde:'', hasta:'', frecuencia:'', color: coloresDisponiblesFiltrados(tratamientos.length)[0] || '#999',
            unidadesPorToma: 1
          }]);
          setTextoMed([...textoMed, '']);
        }}/>

        <ScrollView style={{marginTop:10, overflow:'visible'}}>
          {tratamientos.map((item, index) => {
            const vecesPorDía =
              item.frecuencia === 'cada 8h' ? 3 :
              item.frecuencia === 'cada 12h' ? 2 :
              item.frecuencia === 'cada 24h' ? 1 :
              item.frecuencia === 'toma única' ? 1 : 0;

            const unidad = item.unidad || '';
            const dosisNum = parseFloat(item.dosis) || 0;
            const unidades = parseInt(item.unidadesPorToma) || 1;
            const totalDiario = dosisNum * unidades * vecesPorDía;
            const textoDosis = dosisNum && vecesPorDía && unidades
              ? `${(totalDiario).toFixed(2)} ${unidad}/día`
              : '';

            const filtradas = textoMed[index]?.length >= 2
              ? sugerencias.filter(s =>
                  (s.nombre || '').toLowerCase().includes(textoMed[index].toLowerCase())
                )
              : [];

            return (
              <View key={index} style={styles.fila}>
                <View style={{ position: 'relative' }}>
                  <TouchableOpacity onPress={() =>
                    setColorPickerIndex(colorPickerIndex === index ? null : index)
                  }>
                    <View style={{ backgroundColor: item.color || '#bbb', width: 20, height: 20, borderRadius: 4 }} />
                  </TouchableOpacity>
                  {colorPickerIndex === index && (
                    <View style={styles.colorSelector}>
                      {coloresDisponiblesFiltrados(index).map((c, i) => (
                        c !== item.color && (
                          <TouchableOpacity key={i} onPress={() => {
                            actualizarCampo(index, 'color', c);
                            setColorPickerIndex(null);
                          }}>
                            <View style={[styles.colorOpcion, { backgroundColor: c }]} />
                          </TouchableOpacity>
                        )
                      ))}
                    </View>
                  )}
                </View>

                {Platform.OS === 'web' ? (
                  <>
                    <DatePickerWeb
                      selected={item.desde ? new Date(item.desde) : null}
                      onChange={(date) => actualizarCampo(index, 'desde', format(date, 'yyyy-MM-dd'))}
                      customInput={<TextInput style={styles.fecha} value={formatFecha(item.desde)} />}
                      popperPlacement="top-start"
                      calendarClassName="react-datepicker"
                      wrapperClassName="react-datepicker-wrapper"
                    />
                    <DatePickerWeb
                      selected={item.hasta ? new Date(item.hasta) : null}
                      onChange={(date) => actualizarCampo(index, 'hasta', format(date, 'yyyy-MM-dd'))}
                      customInput={<TextInput style={styles.fecha} value={formatFecha(item.hasta)} />}
                      popperPlacement="top-start"
                      calendarClassName="react-datepicker"
                      wrapperClassName="react-datepicker-wrapper"
                    />
                  </>
                ) : (
                  <>
                    <TouchableOpacity onPress={() => { setFechaIndex(index); setModoFecha('desde'); }} style={styles.fecha}>
                      <Text>{formatFecha(item.desde)}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => { setFechaIndex(index); setModoFecha('hasta'); }} style={styles.fecha}>
                      <Text>{formatFecha(item.hasta)}</Text>
                    </TouchableOpacity>
                  </>
                )}
                <View style={{ flex: 1, position: 'relative' }}>
                  <TextInput
                    style={styles.inputAutocomplete}
                    placeholder="Medicamento"
                    value={textoMed[index]}
                    onChangeText={(text) => {
                      const textos = [...textoMed];
                      textos[index] = text;
                      setTextoMed(textos);
                      actualizarCampo(index, 'medicamento', text);
                      const activo = [...campoActivo];
                      activo[index] = true;
                      setCampoActivo(activo);
                    }}
                    onFocus={() => {
                      const activo = [...campoActivo];
                      activo[index] = true;
                      setCampoActivo(activo);
                    }}
                    onBlur={() => setTimeout(() => {
                      const activo = [...campoActivo];
                      activo[index] = false;
                      setCampoActivo(activo);
                    }, 200)}
                  />
                  {campoActivo[index] && filtradas.length > 0 && (
                    <View style={styles.listaSugerencias}>
                      {filtradas.map((sug) => (
                        <TouchableOpacity
                          key={sug.id}
                          onPress={() => seleccionarMedicamento(sug, index)}
                          onMouseEnter={() => setHovered(sug.id)}
                          onMouseLeave={() => setHovered(null)}
                          style={[styles.autocompleteItem, hovered === sug.id && styles.autocompleteItemHover]}
                        >
                          <Text>{sug.nombre} | {sug.dosis} {sug.unidad} | Tol: {sug.tolerancia}</Text>
                          <TouchableOpacity onPress={() => borrarMedicamento(sug.id)}>
                            <Text style={{ color: 'red', paddingLeft: 6 }}>❌</Text>
                          </TouchableOpacity>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                <TextInput
                  placeholder="Dosis"
                  value={item.dosis}
                  onChangeText={(t) => actualizarCampo(index, 'dosis', t)}
                  style={styles.dosis}
                />
                <Picker selectedValue={item.unidad} onValueChange={(v) => actualizarCampo(index, 'unidad', v)} style={styles.unidad}>
                  <Picker.Item label="mg" value="mg" />
                  <Picker.Item label="UI" value="UI" />
                  <Picker.Item label="comprimido" value="comprimido" />
                </Picker>
                <TextInput
                  placeholder="Unid/toma"
                  value={item.unidadesPorToma?.toString() || '1'}
                  onChangeText={(t) => actualizarCampo(index, 'unidadesPorToma', parseInt(t) || 1)}
                  style={styles.unidades}
                />
                <TextInput
                  placeholder="hh:mm"
                  value={item.tolerancia}
                  onChangeText={(t) => actualizarCampo(index, 'tolerancia', t)}
                  style={styles.tolerancia}
                />
                <Picker selectedValue={item.frecuencia} onValueChange={(v) => actualizarCampo(index, 'frecuencia', v)} style={styles.frecuencia}>
                  <Picker.Item label="cada 8h" value="cada 8h" />
                  <Picker.Item label="cada 12h" value="cada 12h" />
                  <Picker.Item label="cada 24h" value="cada 24h" />
                  <Picker.Item label="toma única" value="toma única" />
                </Picker>
                <Text style={styles.totalDiario}>{textoDosis}</Text>
                <TouchableOpacity onPress={() => {
                  const copia = [...tratamientos];
                  copia.splice(index, 1);
                  setTratamientos(copia);
                }}>
                  <Text>🗑️</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
      </View>

      {Platform.OS !== 'web' && (
        <DateTimePickerModal
          isVisible={fechaIndex !== null}
          mode="date"
          onConfirm={handleConfirmFecha}
          onCancel={() => setFechaIndex(null)}
          locale="es-ES"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: '#f0f4fa' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 10, backgroundColor: '#cfd8dc', borderRadius: 8 },
  card: { height: 350, backgroundColor: '#fff', borderRadius: 10, padding: 8, marginVertical: 10 },
  cardMedicacion: { flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 10, overflow:'visible' },
  title: { fontWeight: 'bold', fontSize: 16, marginBottom: 8 },
  fila: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 8,
    flexWrap: 'wrap', gap: 6, position: 'relative', zIndex: 1,
    overflow:'visible'
  },
  colorSelector: {
    position: 'absolute', top: 26, left: 0,
    flexDirection: 'row', flexWrap: 'wrap', padding: 4,
    backgroundColor: '#fff', borderRadius: 6, borderWidth: 1,
    borderColor: '#ccc', zIndex: 9999
  },
  colorOpcion: { width: 18, height: 18, borderRadius: 4, margin: 2 },
  fecha: {
    width: 90, height: 36, padding: 4,
    borderWidth: 1, borderRadius: 6,
    backgroundColor: '#fff', fontSize: 13,
    zIndex: 10000
  },
  inputAutocomplete: {
    minWidth: 140, borderWidth: 1, borderColor: '#bbb',
    paddingHorizontal: 8, borderRadius: 6, backgroundColor: '#fff', height: 36
  },
  listaSugerencias: {
    position: 'absolute', top: 36, left: 0, width: '100%',
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#ccc',
    borderRadius: 6, zIndex: 9999, maxHeight: 160
  },
  autocompleteItem: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6,
    borderBottomWidth: 1, borderBottomColor: '#eee', backgroundColor: '#fff'
  },
  autocompleteItemHover: { backgroundColor: '#e3f2fd', cursor: 'pointer' },
  dosis: { width: 60, borderWidth: 1, padding: 4, height: 36, borderRadius: 6, backgroundColor: '#fff' },
  unidad: { width: 80, borderWidth: 1, height: 36, borderRadius: 6, backgroundColor: '#fff' },
  tolerancia: { width: 70, borderWidth: 1, padding: 4, height: 36, borderRadius: 6, backgroundColor: '#fff' },
  frecuencia: { width: 100, borderWidth: 1, height: 36, borderRadius: 6, backgroundColor: '#fff' },
  unidades: { width: 60, borderWidth: 1, padding: 4, height: 36, borderRadius: 6, backgroundColor: '#fff' },
  totalDiario: {
    width: 90, backgroundColor: '#f1f1f1', paddingHorizontal: 6,
    paddingVertical: 4, borderRadius: 6, textAlign: 'center',
    fontSize: 13, borderWidth: 1, borderColor: '#ccc', height: 36,
    justifyContent: 'center'
  }
});



