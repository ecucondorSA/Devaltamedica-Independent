import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import TelemedicineCall from '../TelemedicineCall';

// Mock de socket.io-client
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    close: jest.fn(),
  })),
}));

// Mock de useAuth
jest.mock('../../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      role: 'patient',
    },
  }),
}));

// Mock de useToast
jest.mock('../../../hooks/useToast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Mock de navigator.mediaDevices
Object.defineProperty(navigator, 'mediaDevices', {
  value: {
    getUserMedia: jest.fn(() =>
      Promise.resolve({
        getTracks: () => [
          {
            kind: 'video',
            enabled: true,
          },
          {
            kind: 'audio',
            enabled: true,
          },
        ],
      })
    ),
    getDisplayMedia: jest.fn(() =>
      Promise.resolve({
        getVideoTracks: () => [
          {
            kind: 'video',
            enabled: true,
          },
        ],
      })
    ),
  },
  writable: true,
});

// Mock de RTCPeerConnection
global.RTCPeerConnection = jest.fn(() => ({
  addTrack: jest.fn(),
  ontrack: jest.fn(),
  onicecandidate: jest.fn(),
  oniceconnectionstatechange: jest.fn(),
  getSenders: jest.fn(() => [
    {
      track: { kind: 'video' },
      replaceTrack: jest.fn(),
    },
    {
      track: { kind: 'audio' },
      replaceTrack: jest.fn(),
    },
  ]),
  close: jest.fn(),
}));

describe('TelemedicineCall Component', () => {
  const defaultProps = {
    sessionId: 'test-session',
    roomId: 'test-room',
    onEndCall: jest.fn(),
    onError: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock de process.env
    jest.stubEnv('NEXT_PUBLIC_TELEMEDICINE_URL', 'ws://localhost:3001');
  });

  afterEach(() => {
    jest.unstubAllEnvs();
  });

  describe('Rendering', () => {
    it('should render loading state initially', () => {
      render(<TelemedicineCall {...defaultProps} />);
      
      expect(screen.getByText('Conectando...')).toBeInTheDocument();
      expect(screen.getByText('Iniciando sesión de telemedicina')).toBeInTheDocument();
    });

    it('should render main interface after connection', async () => {
      render(<TelemedicineCall {...defaultProps} />);
      
      // Simular conexión exitosa
      await act(async () => {
        // Trigger socket connection
        const { io } = await import('socket.io-client');
        const mockSocket = io();
        mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1]();
      });

      await waitFor(() => {
        expect(screen.queryByText('Conectando...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Video Controls', () => {
    it('should toggle video when video button is clicked', async () => {
      render(<TelemedicineCall {...defaultProps} />);
      
      await act(async () => {
        const { io } = await import('socket.io-client');
        const mockSocket = io();
        mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1]();
      });

      await waitFor(() => {
        const videoButton = screen.getByRole('button', { name: /video/i });
        expect(videoButton).toBeInTheDocument();
      });

      const videoButton = screen.getByRole('button', { name: /video/i });
      fireEvent.click(videoButton);

      // Verificar que se emitió el evento de toggle
      const { io } = await import('socket.io-client');
      const mockSocket = io();
      expect(mockSocket.emit).toHaveBeenCalledWith('toggle-media', {
        type: 'video',
        enabled: false,
        sessionId: 'test-room',
      });
    });

    it('should toggle audio when audio button is clicked', async () => {
      render(<TelemedicineCall {...defaultProps} />);
      
      await act(async () => {
        const { io } = await import('socket.io-client');
        const mockSocket = io();
        mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1]();
      });

      await waitFor(() => {
        const audioButton = screen.getByRole('button', { name: /mic/i });
        expect(audioButton).toBeInTheDocument();
      });

      const audioButton = screen.getByRole('button', { name: /mic/i });
      fireEvent.click(audioButton);

      const { io } = await import('socket.io-client');
      const mockSocket = io();
      expect(mockSocket.emit).toHaveBeenCalledWith('toggle-media', {
        type: 'audio',
        enabled: false,
        sessionId: 'test-room',
      });
    });
  });

  describe('Screen Sharing', () => {
    it('should toggle screen sharing when button is clicked', async () => {
      render(<TelemedicineCall {...defaultProps} />);
      
      await act(async () => {
        const { io } = await import('socket.io-client');
        const mockSocket = io();
        mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1]();
      });

      await waitFor(() => {
        const screenShareButton = screen.getByRole('button', { name: /monitor/i });
        expect(screenShareButton).toBeInTheDocument();
      });

      const screenShareButton = screen.getByRole('button', { name: /monitor/i });
      fireEvent.click(screenShareButton);

      // Verificar que se llamó getDisplayMedia
      expect(navigator.mediaDevices.getDisplayMedia).toHaveBeenCalledWith({
        video: true,
        audio: false,
      });
    });

    it('should handle screen sharing error gracefully', async () => {
      // Mock error en getDisplayMedia
      navigator.mediaDevices.getDisplayMedia = jest.fn(() =>
        Promise.reject(new Error('Permission denied'))
      );

      render(<TelemedicineCall {...defaultProps} />);
      
      await act(async () => {
        const { io } = await import('socket.io-client');
        const mockSocket = io();
        mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1]();
      });

      await waitFor(() => {
        const screenShareButton = screen.getByRole('button', { name: /monitor/i });
        expect(screenShareButton).toBeInTheDocument();
      });

      const screenShareButton = screen.getByRole('button', { name: /monitor/i });
      fireEvent.click(screenShareButton);

      // Verificar que se mostró toast de error
      const { useToast } = await import('../../../hooks/useToast');
      const { toast } = useToast();
      expect(toast).toHaveBeenCalledWith({
        title: 'Error al compartir pantalla',
        description: 'No se pudo iniciar la compartición de pantalla',
        variant: 'destructive',
      });
    });
  });

  describe('Chat Functionality', () => {
    it('should toggle chat panel when chat button is clicked', async () => {
      render(<TelemedicineCall {...defaultProps} />);
      
      await act(async () => {
        const { io } = await import('socket.io-client');
        const mockSocket = io();
        mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1]();
      });

      await waitFor(() => {
        const chatButton = screen.getByRole('button', { name: /message/i });
        expect(chatButton).toBeInTheDocument();
      });

      const chatButton = screen.getByRole('button', { name: /message/i });
      fireEvent.click(chatButton);

      // Verificar que se muestra el panel de chat
      expect(screen.getByText('Chat')).toBeInTheDocument();
    });

    it('should send chat message when form is submitted', async () => {
      render(<TelemedicineCall {...defaultProps} />);
      
      await act(async () => {
        const { io } = await import('socket.io-client');
        const mockSocket = io();
        mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1]();
      });

      await waitFor(() => {
        const chatButton = screen.getByRole('button', { name: /message/i });
        expect(chatButton).toBeInTheDocument();
      });

      const chatButton = screen.getByRole('button', { name: /message/i });
      fireEvent.click(chatButton);

      const messageInput = screen.getByPlaceholderText('Escribe un mensaje...');
      const sendButton = screen.getByText('Enviar');

      fireEvent.change(messageInput, { target: { value: 'Test message' } });
      fireEvent.click(sendButton);

      const { io } = await import('socket.io-client');
      const mockSocket = io();
      expect(mockSocket.emit).toHaveBeenCalledWith('chat-message', {
        sessionId: 'test-room',
        message: 'Test message',
        type: 'text',
      });
    });

    it('should send message when Enter key is pressed', async () => {
      render(<TelemedicineCall {...defaultProps} />);
      
      await act(async () => {
        const { io } = await import('socket.io-client');
        const mockSocket = io();
        mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1]();
      });

      await waitFor(() => {
        const chatButton = screen.getByRole('button', { name: /message/i });
        expect(chatButton).toBeInTheDocument();
      });

      const chatButton = screen.getByRole('button', { name: /message/i });
      fireEvent.click(chatButton);

      const messageInput = screen.getByPlaceholderText('Escribe un mensaje...');
      fireEvent.change(messageInput, { target: { value: 'Test message' } });
      fireEvent.keyPress(messageInput, { key: 'Enter', code: 'Enter' });

      const { io } = await import('socket.io-client');
      const mockSocket = io();
      expect(mockSocket.emit).toHaveBeenCalledWith('chat-message', {
        sessionId: 'test-room',
        message: 'Test message',
        type: 'text',
      });
    });
  });

  describe('Vitals Sharing', () => {
    it('should share vitals when heart button is clicked (patient role)', async () => {
      render(<TelemedicineCall {...defaultProps} />);
      
      await act(async () => {
        const { io } = await import('socket.io-client');
        const mockSocket = io();
        mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1]();
      });

      await waitFor(() => {
        const vitalsButton = screen.getByRole('button', { name: /heart/i });
        expect(vitalsButton).toBeInTheDocument();
      });

      const vitalsButton = screen.getByRole('button', { name: /heart/i });
      fireEvent.click(vitalsButton);

      const { io } = await import('socket.io-client');
      const mockSocket = io();
      expect(mockSocket.emit).toHaveBeenCalledWith('share-vitals', {
        sessionId: 'test-room',
        vitals: expect.objectContaining({
          heartRate: expect.any(Number),
          bloodPressure: expect.objectContaining({
            systolic: expect.any(Number),
            diastolic: expect.any(Number),
          }),
          temperature: expect.any(Number),
          oxygenSaturation: expect.any(Number),
          timestamp: expect.any(Date),
        }),
      });
    });
  });

  describe('Settings Panel', () => {
    it('should toggle settings panel when settings button is clicked', async () => {
      render(<TelemedicineCall {...defaultProps} />);
      
      await act(async () => {
        const { io } = await import('socket.io-client');
        const mockSocket = io();
        mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1]();
      });

      await waitFor(() => {
        const settingsButton = screen.getByRole('button', { name: /settings/i });
        expect(settingsButton).toBeInTheDocument();
      });

      const settingsButton = screen.getByRole('button', { name: /settings/i });
      fireEvent.click(settingsButton);

      expect(screen.getByText('Configuración')).toBeInTheDocument();
    });
  });

  describe('Fullscreen Mode', () => {
    it('should toggle fullscreen when fullscreen button is clicked', async () => {
      render(<TelemedicineCall {...defaultProps} />);
      
      await act(async () => {
        const { io } = await import('socket.io-client');
        const mockSocket = io();
        mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1]();
      });

      await waitFor(() => {
        const fullscreenButton = screen.getByRole('button', { name: /maximize/i });
        expect(fullscreenButton).toBeInTheDocument();
      });

      const fullscreenButton = screen.getByRole('button', { name: /maximize/i });
      fireEvent.click(fullscreenButton);

      // Verificar que se cambió el estado de fullscreen
      expect(screen.getByRole('button', { name: /minimize/i })).toBeInTheDocument();
    });
  });

  describe('Session End', () => {
    it('should end session when end call button is clicked', async () => {
      render(<TelemedicineCall {...defaultProps} />);
      
      await act(async () => {
        const { io } = await import('socket.io-client');
        const mockSocket = io();
        mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1]();
      });

      await waitFor(() => {
        const endCallButton = screen.getByRole('button', { name: /phoneoff/i });
        expect(endCallButton).toBeInTheDocument();
      });

      const endCallButton = screen.getByRole('button', { name: /phoneoff/i });
      fireEvent.click(endCallButton);

      const { io } = await import('socket.io-client');
      const mockSocket = io();
      expect(mockSocket.emit).toHaveBeenCalledWith('end-session', {
        sessionId: 'test-room',
      });
      expect(defaultProps.onEndCall).toHaveBeenCalled();
    });
  });

  describe('Socket Events', () => {
    it('should handle participant joined event', async () => {
      render(<TelemedicineCall {...defaultProps} />);
      
      await act(async () => {
        const { io } = await import('socket.io-client');
        const mockSocket = io();
        mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1]();
        
        // Simular evento de participante unido
        mockSocket.on.mock.calls.find(call => call[0] === 'participant-joined')[1]({
          id: '2',
          name: 'Dr. Smith',
          role: 'doctor',
        });
      });

      const { useToast } = await import('../../../hooks/useToast');
      const { toast } = useToast();
      expect(toast).toHaveBeenCalledWith({
        title: 'Participante conectado',
        description: 'Dr. Smith se unió a la sesión',
      });
    });

    it('should handle participant disconnected event', async () => {
      render(<TelemedicineCall {...defaultProps} />);
      
      await act(async () => {
        const { io } = await import('socket.io-client');
        const mockSocket = io();
        mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1]();
        
        // Simular evento de participante desconectado
        mockSocket.on.mock.calls.find(call => call[0] === 'participant-disconnected')[1]({
          participantId: '2',
          participantName: 'Dr. Smith',
        });
      });

      const { useToast } = await import('../../../hooks/useToast');
      const { toast } = useToast();
      expect(toast).toHaveBeenCalledWith({
        title: 'Participante desconectado',
        description: 'Dr. Smith se desconectó',
      });
    });

    it('should handle chat message event', async () => {
      render(<TelemedicineCall {...defaultProps} />);
      
      await act(async () => {
        const { io } = await import('socket.io-client');
        const mockSocket = io();
        mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1]();
        
        // Abrir chat
        const chatButton = screen.getByRole('button', { name: /message/i });
        fireEvent.click(chatButton);
        
        // Simular mensaje de chat
        mockSocket.on.mock.calls.find(call => call[0] === 'chat-message')[1]({
          id: '1',
          senderId: '2',
          senderName: 'Dr. Smith',
          message: 'Hello patient',
          timestamp: new Date(),
          type: 'text',
        });
      });

      await waitFor(() => {
        expect(screen.getByText('Hello patient')).toBeInTheDocument();
      });
    });

    it('should handle vitals shared event', async () => {
      render(<TelemedicineCall {...defaultProps} />);
      
      await act(async () => {
        const { io } = await import('socket.io-client');
        const mockSocket = io();
        mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1]();
        
        // Simular signos vitales compartidos
        mockSocket.on.mock.calls.find(call => call[0] === 'vitals-shared')[1]({
          vitals: {
            heartRate: 75,
            bloodPressure: { systolic: 120, diastolic: 80 },
            temperature: 36.5,
            oxygenSaturation: 98,
            timestamp: new Date(),
          },
        });
      });

      const { useToast } = await import('../../../hooks/useToast');
      const { toast } = useToast();
      expect(toast).toHaveBeenCalledWith({
        title: 'Signos vitales compartidos',
        description: 'Se han actualizado los signos vitales',
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle WebRTC initialization error', async () => {
      // Mock error en getUserMedia
      navigator.mediaDevices.getUserMedia = jest.fn(() =>
        Promise.reject(new Error('Camera access denied'))
      );

      render(<TelemedicineCall {...defaultProps} />);
      
      await act(async () => {
        const { io } = await import('socket.io-client');
        const mockSocket = io();
        mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1]();
        
        // Trigger session ready
        mockSocket.on.mock.calls.find(call => call[0] === 'session-ready')[1]({
          participants: [],
        });
      });

      const { useToast } = await import('../../../hooks/useToast');
      const { toast } = useToast();
      expect(toast).toHaveBeenCalledWith({
        title: 'Error de cámara/micrófono',
        description: 'No se pudo acceder a la cámara o micrófono',
        variant: 'destructive',
      });
    });

    it('should handle socket error', async () => {
      render(<TelemedicineCall {...defaultProps} />);
      
      await act(async () => {
        const { io } = await import('socket.io-client');
        const mockSocket = io();
        mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1]();
        
        // Simular error de socket
        mockSocket.on.mock.calls.find(call => call[0] === 'error')[1]({
          message: 'Connection failed',
        });
      });

      const { useToast } = await import('../../../hooks/useToast');
      const { toast } = useToast();
      expect(toast).toHaveBeenCalledWith({
        title: 'Error de conexión',
        description: 'Connection failed',
        variant: 'destructive',
      });
      expect(defaultProps.onError).toHaveBeenCalledWith('Connection failed');
    });
  });

  describe('Duration Timer', () => {
    it('should display session duration', async () => {
      jest.useFakeTimers();
      
      render(<TelemedicineCall {...defaultProps} />);
      
      await act(async () => {
        const { io } = await import('socket.io-client');
        const mockSocket = io();
        mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1]();
        
        // Simular participantes para activar el timer
        mockSocket.on.mock.calls.find(call => call[0] === 'session-ready')[1]({
          participants: [
            { id: '1', name: 'Patient', role: 'patient' },
            { id: '2', name: 'Doctor', role: 'doctor' },
          ],
        });
      });

      // Avanzar 65 segundos
      act(() => {
        jest.advanceTimersByTime(65000);
      });

      await waitFor(() => {
        expect(screen.getByText('01:05')).toBeInTheDocument();
      });

      jest.useRealTimers();
    });
  });

  describe('Connection Quality', () => {
    it('should display connection quality indicators', async () => {
      render(<TelemedicineCall {...defaultProps} />);
      
      await act(async () => {
        const { io } = await import('socket.io-client');
        const mockSocket = io();
        mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1]();
      });

      await waitFor(() => {
        expect(screen.getByText('excellent')).toBeInTheDocument();
      });
    });
  });

  describe('Cleanup', () => {
    it('should cleanup resources on unmount', async () => {
      const { unmount } = render(<TelemedicineCall {...defaultProps} />);
      
      await act(async () => {
        const { io } = await import('socket.io-client');
        const mockSocket = io();
        mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1]();
      });

      unmount();

      const { io } = await import('socket.io-client');
      const mockSocket = io();
      expect(mockSocket.close).toHaveBeenCalled();
    });
  });
}); 