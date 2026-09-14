# ASEAC — Plataforma de Seguimiento Académico (desplegada)

**ASEAC** es un sistema web estructurado y modular diseñado para la optimización de la gestión académica, la planificación de horarios y el seguimiento interactivo de la malla curricular para estudiantes de Ingeniería de Sistemas.

Esta versión representa el despliegue de la Fase 1, enfocada en la arquitectura visual, la lógica del cliente y la entrega ultrarrápida de contenido y uso de ASEAC.

---

## Arquitectura del Sistema (Fase Beta desplegada)

Actualmente, el entorno de producción opera bajo un modelo **estático y descentralizado**, priorizando la velocidad, la seguridad por diseño (reducción de la superficie de ataque) y la eficiencia de recursos:

* **Frontend Nativo:** Construido íntegramente con HTML5 semántico, CSS3 (mediante el uso intensivo de *Custom Properties* para la manipulación de estados) y JavaScript asíncrono puro (Vanilla JS). No depende de frameworks pesados, garantizando un tiempo de carga y ejecución mínimo pero si de algunas librerias necesarias para la visualizacion y algunas funcionalidades..

* **Despliegue Global:** Alojado y distribuido a través de la infraestructura de **Cloudflare Pages**. El enrutamiento es 100% estático, lo que se traduce en consumo nulo de computación de servidor y latencia mínima, despues de la siguiente version probablemente esto cambie.

* **Despliegue local:** el proyecto puede ser ejecutado localmente en cualquier entorno de desarrollo. el unico uso de los datos referidos a las **cookies** se encuentra en el navegador local del usuario y no pasa  por ningun servidor externo, los datos solo se utlizar para el recuerdo del estado actual de la malla y de las demas funcionalidades.

---

## Módulo Principal

### . Motor de Interfaz y Estados Curriculares
La plataforma no utiliza vistas rígidas. El estado de cada asignatura en la malla (Disponible, Cursando, Aprobada, Bloqueada) se renderiza lógicamente. El motor lee las dependencias (prerrequisitos) y actualiza el árbol DOM (Document Object Model) para reflejar el progreso del estudiante en tiempo real y la comparticion de la malla con otros usuarios y sus estados de materias, notas, tipo de estudio, modo estudio, tareas, apuntes.

