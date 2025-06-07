import React from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// ✅ Estos dos se pueden importar siempre, solo afectan a Web
import 'react-datepicker/dist/react-datepicker.css';
import './App.css';

// Pantallas
import VerPlan from './screens/VerPlan';
import LoginScreen from './screens/LoginScreen';
import MedicoTratamientoScreen from './screens/MedicoTratamientoScreen';
import PantallaMedico from './screens/PantallaMedico';
import PantallaPaciente from './screens/PantallaPaciente';
import PantallaSuperusuario from './screens/PantallaSuperusuario';
import AltaPacienteScreen from './screens/AltaPacienteScreen';
import ListadoPacientesScreen from './screens/ListadoPacientesScreen';
import CalendarioMensual from './screens/CalendarioMensual';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="PantallaMedico" component={PantallaMedico} />
        <Stack.Screen name="PantallaPaciente" component={PantallaPaciente} />
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ title: 'Iniciar Sesión' }}
        />
        <Stack.Screen
          name="MedicoTratamiento"
          component={MedicoTratamientoScreen}
          options={{ title: ' ' }}
        />
        <Stack.Screen
          name="AltaPaciente"
          component={AltaPacienteScreen}
          options={{ title: 'Alta de Paciente' }}
        />
        <Stack.Screen
          name="ListadoPacientes"
          component={ListadoPacientesScreen}
          options={{ title: 'Pacientes del Médico' }}
        />
        <Stack.Screen
          name="CalendarioMensual"
          component={CalendarioMensual}
          options={{ title: 'Calendario de Medicación' }}
        />
        <Stack.Screen
          name="PantallaSuperusuario"
          component={PantallaSuperusuario}
          options={{ title: 'Gestión de Usuarios' }}
        />
        <Stack.Screen
          name="VerPlan"
          component={VerPlan}
          options={{ title: 'Ver Plan de Tratamiento' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
