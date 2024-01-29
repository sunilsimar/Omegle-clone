import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Socket, io } from "socket.io-client";

const URL = "http://localhost:3000";

export const Room = ({
  name,
  localAudioTrack,
  localVideoTrack,
}: {
  name: string;
  localAudioTrack: MediaStreamTrack | null;
  localVideoTrack: MediaStreamTrack | null;
}) => {
  const [searchParams] = useSearchParams("");
  // const name = searchParsetSearchParamsams.get("name");
  const [socket, setSocket] = useState<null | Socket>(null);
  const [lobby, setLobby] = useState(true);
  const [sendingPc, setSendingPc] = useState<null | RTCPeerConnection>(null);
  const [receivingPc, setRecevingPc] = useState<null | RTCPeerConnection>(null);
  const [remoteVideoTrack, setRemoteVideoTrack] =
    useState<MediaStreamTrack | null>(null);
  const [remoteAudioTrack, setRemoteAudioTrack] =
    useState<MediaStreamTrack | null>(null);
  const [remoteMediaStream, setRemoteMediaStream] =
    useState<MediaStream | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>();
  const localVideoRef = useRef<HTMLVideoElement>();

  useEffect(() => {
    const socket = io(URL);
    socket.on("send-offer", async ({ roomId }) => {
      console.log("Sending offer");
      setLobby(false);
      const pc = new RTCPeerConnection();

      setSendingPc(pc);
      if (localVideoTrack) {
        pc.addTrack(localVideoTrack);
      }
      if (localAudioTrack) {
        pc.addTrack(localAudioTrack);
      }

      pc.onicecandidate = async (e) => {
        console.log("receiving ice candidate locally");
        if (e.candidate) {
          socket.emit("add-ice-candidate", {
            candidate: e.candidate,
            type: "sender",
            roomId,
          });
        }
      };

      pc.onnegotiationneeded = async () => {
        console.log("on negotitation needed, sending offer");
        const sdp = await pc.createOffer();
        //@ts-ignore
        pc.setLocalDescription(sdp);
        socket.emit("offer", {
          sdp,
          roomId,
        });
      };
    });

    socket.on("offer", async ({ roomId, sdp: remoteSdp }) => {
      console.log("receiving offer");
      setLobby(false);
      const pc = new RTCPeerConnection();
      pc.setRemoteDescription(remoteSdp);
      const sdp = await pc.createAnswer();
      //@ts-ignore
      pc.setLocalDescription(sdp);
      const stream = new MediaStream();
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }

      setRemoteMediaStream(stream);
      //trickle ice
      setRecevingPc(pc);

      window.pcr = pc;
      pc.ontrack = (e) => {
        alert("onTrack");
        // const { track, type } = e;
        // if (type == "audio") {
        //   //   setRemoteAudioTrack(track);
        //   //@ts-ignore
        //   remoteVideoRef.current?.srcObject.addTrack(track);
        // } else {
        //   //   setRemoteAudioTrack(track);
        //   //@ts-ignore
        //   remoteVideoRef.current?.srcObject.addTrack(track);
        // }
        // //@ts-ignore
        // remoteVideoRef.current.play();
      };

      pc.onicecandidate = async (e) => {
        if (!e.candidate) {
          return;
        }
        console.log("omn ice candidate on receiving seide");
        if (e.candidate) {
          socket.emit("add-ice-candidate", {
            candidate: e.candidate,
            type: "receiver",
            roomId,
          });
        }
      };

      socket.emit("answer", {
        roomId,
        sdp: sdp,
      });

      setTimeout(() => {
        const track1 = pc.getTransceivers()[0].receiver.track;
        const track2 = pc.getTransceivers()[1].receiver.track;

        if (track1.kind == "video") {
          setRemoteAudioTrack(track2);
          setRemoteVideoTrack(track1);
        } else {
          setRemoteAudioTrack(track2);
          setRemoteVideoTrack(track1);
        }
        //@ts-ignore
        remoteVideoRef.current.srcObject.addTrack(track1);
        //@ts-ignore
        remoteVideoRef.current.srcObject.addTrack(track2);
        //@ts-ignore
        remoteVideoRef.current.play();
      }, 5000);
    });

    socket.on("answer", ({ roomId, sdp: remoteSdp }) => {
      setLobby(false);
      setSendingPc((pc) => {
        pc?.setRemoteDescription(remoteSdp);
        return pc;
      });
      console.log("loop closed");
    });

    socket.on("lobby", () => {
      setLobby(true);
    });

    socket.on("add-ice-candidate", ({ candidate, type }) => {
      console.log("add ice candidate from remote");
      console.log({
        candidate,
        type,
      });
      if (type == "sender") {
        setRecevingPc((pc) => {
          pc?.addIceCandidate(candidate);
          return pc;
        });
      } else {
        setRecevingPc((pc) => {
          pc?.addIceCandidate(candidate);
          return pc;
        });
      }
    });

    setSocket(socket);
  }, [name]);

  useEffect(() => {
    if (localVideoRef.current) {
      if (localVideoTrack) {
        localVideoRef.current.srcObject = new MediaStream([localVideoTrack]);
      }

      localVideoRef.current.play();
    }
  }, [localVideoRef]);

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Navbar */}
      <header className="flex items-center justify-between px-4 py-2 bg-white shadow border-b border-black/20">
        <h1 className="text-2xl font-bold text-gray-800">Omegle</h1>
        <div className="text-sm text-gray-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            className="h-5 w-5 mr-1 inline-block"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          <span>Online: 1234</span>
        </div>
      </header>
      {/* Main */}
      <main className="flex-1 gap-1 overflow-auto p-4 bg-white flex justify-center">
        {/* Video Section */}
        <div className="flex flex-col space-y-4 w-1/2">
          <video
            autoPlay
            width={500}
            height={500}
            ref={localVideoRef}
            className="overflow-hidden shadow-lg w-full mx-auto p-4 h-full border-2 border-gray-300 rounded-md bg-black"
          ></video>

          <video
            autoPlay
            width={500}
            height={500}
            ref={remoteVideoRef}
            className="overflow-hidden shadow-lg w-full mx-auto p-4 h-full border-2 border-gray-300 rounded-md bg-black"
          ></video>
        </div>
        {/* Chat Box */}
        <div className="w-px bg-black/20 mx-4" />
        <div className="rounded-lg overflow-hidden shadow-lg bg-white max-w-3xl p-4 space-y-4 w-1/2 flex flex-col h-full">
          <div className="flex-1 overflow-auto space-y-4 w-full">
            <div className="flex items-start gap-4">
              <span className="relative flex shrink-0 overflow-hidden rounded-full w-10 h-10 border">
                <span className="flex h-full w-full items-center justify-center rounded-full bg-muted">
                  XYZ
                </span>
              </span>
              <div className="text-sm">
                <div className="font-semibold">XYZ</div>
                <div>Hello, how are you?</div>
              </div>
            </div>
            <div className="flex items-start gap-4 justify-end">
              <div className="text-sm text-right">
                <div className="font-semibold">You</div>
                <div>I'm good, thanks! How about you?</div>
              </div>
              <span className="relative flex shrink-0 overflow-hidden rounded-full w-10 h-10 border">
                <span className="flex h-full w-full items-center justify-center rounded-full bg-muted">
                  You
                </span>
              </span>
            </div>
          </div>
          <div className="flex items-start justify-between px-4 py-2 bg-white shadow">
            <div className="flex-1 mr-4">
              <input
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full"
                placeholder="Type your message..."
              />
            </div>
            <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-black text-white hover:bg-black/90 h-10 px-4 py-2 mr-2">
              Send
            </button>
            <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
              Next Person
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
