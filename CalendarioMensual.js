// CalendarioMensual.js - Ajustado para barras más grandes, texto negro, altura compacta exacta a 5 semanas

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  addMonths,
  getDay,
  isSameDay
} from 'date-fns';
import { es } from 'date-fns/locale';

const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const festivos = [
  '2025-01-01', '2025-12-25', '2025-08-15', '2025-10-12', '2025-11-01',
];

const CalendarioMensual = ({ tratamientos, onDayPress }) => {
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

  const nivelesPorSemana = semanas.map(() => []);
  tratamientos.forEach((t, i) => {
    if (!t.desde || !t.hasta) return;
    const start = new Date(t.desde);
    const end = new Date(t.hasta);
    semanas.forEach((semana, wIdx) => {
      semana.forEach((dia, dIdx) => {
        const fechaStr = format(dia, 'yyyy-MM-dd');
        if (fechaStr >= t.desde && fechaStr <= t.hasta) {
          if (!nivelesPorSemana[wIdx][dIdx]) nivelesPorSemana[wIdx][dIdx] = [];
          nivelesPorSemana[wIdx][dIdx].push(i);
        }
      });
    });
  });

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

  const esFestivo = (dia) => {
    const diaStr = format(dia, 'yyyy-MM-dd');
    return festivos.includes(diaStr);
  };

  return (
    <View style={styles.contenedor}>
      <View style={styles.mesNavegacion}>
        <TouchableOpacity onPress={() => setMesVisible(prev => addMonths(prev, -1))}><Text style={styles.flecha}>⬅️</Text></TouchableOpacity>
        <Text style={styles.nombreMes}>{format(mesVisible, "MMMM yyyy", { locale: es })}</Text>
        <TouchableOpacity onPress={() => setMesVisible(prev => addMonths(prev, 1))}><Text style={styles.flecha}>➡️</Text></TouchableOpacity>
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
              const festivo = esFestivo(dia);
              const weekend = getDay(dia) === 0 || getDay(dia) === 6;
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
                <TouchableOpacity key={dIdx} onPress={() => onDayPress({ dateString: fechaStr })} style={styles.touchable}>
                  <View style={[styles.celda, !esDelMes && styles.fueraDeMes, hoyEs && styles.hoy]}>
                    <View style={styles.diaBox}>
                      <Text style={[styles.numeroDia, (!esDelMes || weekend || festivo) && styles.numeroGris]}>
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
    backgroundColor: '#e3f2fd',
    borderColor: '#90caf9',
    borderWidth: 1,
    overflow: 'hidden',
  },
  mesNavegacion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#bbdefb',
  },
  nombreMes: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0d47a1',
  },
  flecha: {
    fontSize: 18,
    paddingHorizontal: 10,
    color: '#0d47a1',
  },
  encabezadoDias: {
    flexDirection: 'row',
    backgroundColor: '#90caf9',
    paddingVertical: 8,
    borderBottomColor: '#64b5f6',
    borderBottomWidth: 1,
  },
  diaEncabezado: {
    flex: 1,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
    color: '#0d47a1',
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
    borderColor: '#90caf9',
    borderWidth: 0.5,
    position: 'relative',
    backgroundColor: '#ffffff',
  },
  diaBox: {
    paddingTop: 2,
    paddingLeft: 2,
  },
  numeroDia: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0d47a1',
  },
  numeroGris: {
    color: '#90a4ae',
    opacity: 0.6,
  },
  hoy: {
    borderColor: '#1976d2',
    borderWidth: 2,
    backgroundColor: '#e1f5fe',
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

export default CalendarioMensual;

