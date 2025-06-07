// screens/PantallaPaciente.js
import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ImageBackground, BackHandler
} from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { useFocusEffect } from '@react-navigation/native';
import { db } from '../firebaseConfig';

export default function PantallaPaciente({ route, navigation }) {
  const { nick } = route.params;
  const [planes, setPlanes] = useState([]);
  const scrollRef = useRef(null);

  useEffect(() => {
    const cargarPlanes = async () => {
      try {
        const snap = await getDocs(collection(db, 'usuarios'));
        const usuario = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).find(u => u.nick === nick);

        if (!usuario) return;

        const planesSnap = await getDocs(collection(db, `usuarios/${usuario.id}/planes`));
        const lista = planesSnap.docs.map(doc => ({ id: doc.id, pacienteId: usuario.id, ...doc.data() }));
        lista.sort((a, b) => (a.creadoEn?.seconds || 0) - (b.creadoEn?.seconds || 0));
        setPlanes(lista);

        setTimeout(() => {
          if (scrollRef.current) scrollRef.current.scrollToEnd({ animated: true });
        }, 500);
      } catch (e) {
        console.log('Error cargando planes:', e.message);
      }
    };

    cargarPlanes();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        navigation.replace('Login');
        return true;
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [navigation])
  );

  return (
    <ImageBackground
      source={require('../assets/fondo.png')}
      style={styles.fondo}
      resizeMode="cover"
    >
      <ScrollView contentContainerStyle={styles.container} ref={scrollRef}>
        <Text style={styles.titulo}>👩 Bienvenida, {nick}</Text>
        <Text style={styles.subtitulo}>Aquí puedes consultar tus planes de tratamiento</Text>

        {planes.map((plan, i) => {
          const activo = i === planes.length - 1;
          return (
            <View key={plan.id} style={[styles.card, activo ? styles.activo : styles.inactivo]}>
              <View style={styles.encabezado}>
                <View>
                  <Text style={styles.nombre}>{plan.nombre}</Text>
                  <Text style={styles.fecha}>
                    🗓️ {plan.creadoEn?.toDate?.().toLocaleDateString?.() || 'Fecha desconocida'}
                  </Text>
                  <Text style={styles.creador}>Creado por: {plan.creadoPor}</Text>
                </View>
                <TouchableOpacity onPress={() => navigation.navigate('VerPlan', {
                  pacienteId: plan.pacienteId,
                  planId: plan.id,
                  soloLectura: true
                })}>
                  <Text style={styles.ver}>👁️</Text>
                </TouchableOpacity>
              </View>
              {activo && <Text style={styles.activoTexto}>📌 Plan activo</Text>}
            </View>
          );
        })}
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  fondo: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    padding: 16,
    paddingBottom: 100
  },
  titulo: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#ab3b83',
    marginBottom: 6,
    textShadowColor: '#fff',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1
  },
  subtitulo: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#555',
    textShadowColor: '#fff',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#fff4fa',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3
  },
  activo: {
    borderWidth: 2,
    borderColor: '#d81b60'
  },
  inactivo: {
    opacity: 0.7
  },
  encabezado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  nombre: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6a1b9a'
  },
  ver: {
    fontSize: 18
  },
  fecha: {
    marginTop: 8,
    fontSize: 14,
    color: '#444'
  },
  creador: {
    fontSize: 14,
    color: '#777'
  },
  activoTexto: {
    marginTop: 10,
    fontSize: 15,
    color: '#d81b60'
  }
});
