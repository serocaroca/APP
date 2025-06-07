// CalendarioMensualRosa.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  eachDayOfInterval, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  format, isSameMonth, isToday, addMonths, getDay
} from 'date-fns';
import { es } from 'date-fns/locale';

const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const CalendarioMensualRosa = ({ tratamientos, onDayPress }) => {
  const [mesVisible, setMesVisible] = useState(new Date());

  const mesInicio = startOfMonth(mesVisible);
  const mesFin = endOfMonth(mesVisible);
  const calendarioInicio = startOfWeek(mesInicio, { weekStartsOn: 1 });
  const calendarioFin = endOfWeek(mesFin, { weekStartsOn: 1 });
  const dias = eachDayOfInterval({ start: calendarioInicio, end: calendarioFin });

  const semanas = [];
  for (let i = 0; i < dias.length; i += 7) {
    semanas.push(dias.slice(i, i + 7));
  }

  const tratamientoNiveles = {};
  semanas.forEach((semana, wIdx) => {
    semana.forEach((dia, dIdx) => {
      const fechaStr = format(dia, 'yyyy-MM-dd');
      tratamientos.forEach((t, i) => {
        if (t.desde && t.hasta && fechaStr >= t.desde && fechaStr <= t.hasta) {
          if (!(i in tratamientoNiveles)) tratamientoNiveles[i] = {};
          if (!(wIdx in tratamientoNiveles[i])) {
            let nivel = 0;
            while (Object.values(tratamientoNiveles).some(obj => obj[wIdx] === nivel)) nivel++;
            tratamientoNiveles[i][wIdx] = nivel;
          }
        }
      });
    });
  });

  return (
    <View style={styles.contenedor}>
      <View style={styles.mesNavegacion}>
        <TouchableOpacity onPress={() => setMesVisible(prev => addMonths(prev, -1))}>
          <Text style={styles.flecha}>⬅️</Text>
        </TouchableOpacity>
        <Text style={styles.nombreMes}>
          {format(mesVisible, "MMMM yyyy", { locale: es })}
        </Text>
        <TouchableOpacity onPress={() => setMesVisible(prev => addMonths(prev, 1))}>
          <Text style={styles.flecha}>➡️</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.encabezadoDias}>
        {diasSemana.map((dia, i) => (
          <Text key={i} style={styles.diaEncabezado}>{dia}</Text>
        ))}
      </View>

      {semanas.map((semana, wIdx) => {
        const baseHeight = 90;
        const extra = Math.max(...semana.map((dia) => {
          const fechaStr = format(dia, 'yyyy-MM-dd');
          return tratamientos.filter(t => t.desde && t.hasta && fechaStr >= t.desde && fechaStr <= t.hasta).length;
        }), 0);
        const dynamicHeight = baseHeight + Math.max(0, extra - 1) * 26;

        return (
          <View key={wIdx} style={[styles.filaSemana, { height: dynamicHeight }]}>
            {semana.map((dia, dIdx) => {
              const fechaStr = format(dia, 'yyyy-MM-dd');
              const esDelMes = isSameMonth(dia, mesVisible);
              const hoyEs = isToday(dia);
              const tratamientosDelDia = tratamientos.map((t, i) => {
                if (t.desde && t.hasta && fechaStr >= t.desde && fechaStr <= t.hasta) {
                  const esInicio = fechaStr === t.desde;
                  const esFin = fechaStr === t.hasta;
                  const nivel = tratamientoNiveles[i][wIdx];
                  return { ...t, index: i, esInicio, esFin, nivel };
                }
                return null;
              }).filter(Boolean);

              return (
                <TouchableOpacity key={dIdx} onPress={() => onDayPress?.({ dateString: fechaStr })} style={styles.touchable}>
                  <View style={[styles.celda, !esDelMes && styles.fueraDeMes, hoyEs && styles.hoy]}>
                    <View style={styles.diaBox}>
                      <Text style={[styles.numeroDia, !esDelMes && styles.numeroGris]}>
                        {format(dia, 'd')}
                      </Text>
                    </View>
                    {tratamientosDelDia.map((t, idx) => (
                      <View key={idx} style={[
                        styles.barra,
                        { backgroundColor: t.color, top: 20 + t.nivel * 26 },
                        t.esInicio && styles.inicioBarra,
                        t.esFin && styles.finBarra,
                      ]}>
                        {t.esInicio && <Text style={styles.textoLinea}>
                          {`${t.medicamento || ''} ${t.dosis || ''} ${t.frecuencia || ''}`.trim()}
                        </Text>}
                      </View>
                    ))}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  contenedor: {
    borderRadius: 10,
    backgroundColor: '#fff0f7',
    borderColor: '#f8bbd0',
    borderWidth: 1,
    overflow: 'hidden',
  },
  mesNavegacion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fce4ec',
  },
  nombreMes: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#c2185b',
  },
  flecha: {
    fontSize: 18,
    paddingHorizontal: 10,
    color: '#c2185b',
  },
  encabezadoDias: {
    flexDirection: 'row',
    backgroundColor: '#fce4ec',
    paddingVertical: 8,
    borderBottomColor: '#f8bbd0',
    borderBottomWidth: 1,
  },
  diaEncabezado: {
    flex: 1,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
    color: '#c2185b',
  },
  filaSemana: {
    flexDirection: 'row',
    width: '100%',
  },
  touchable: {
    flex: 1,
  },
  celda: {
    flex: 1,
    borderColor: '#f8bbd0',
    borderWidth: 0.5,
    position: 'relative',
    backgroundColor: '#ffffff',
  },
  fueraDeMes: {
    backgroundColor: '#fff0f7',
  },
  diaBox: {
    paddingTop: 2,
    paddingLeft: 2,
  },
  numeroDia: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#c2185b',
  },
  numeroGris: {
    color: '#aaa',
    opacity: 0.6,
  },
  hoy: {
    borderColor: '#d81b60',
    borderWidth: 2,
    backgroundColor: '#fce4ec',
  },
  barra: {
    position: 'absolute',
    left: 2,
    right: 2,
    height: 22,
    borderRadius: 0,
    justifyContent: 'center',
    paddingLeft: 4,
  },
  inicioBarra: {
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
    marginLeft: 4,
  },
  finBarra: {
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
    marginRight: 4,
  },
  textoLinea: {
    fontSize: 11,
    color: 'black',
    fontWeight: '600',
  },
});

export default CalendarioMensualRosa;
