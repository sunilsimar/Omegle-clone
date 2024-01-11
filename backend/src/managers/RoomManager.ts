import { User } from "./UserManager";

let GLOBAL_ROOM_ID = 0;

interface Room {
  user1: User;
  user2: User;
}

export class RoomManager {
  private rooms: Map<string, Room>;
  constructor() {
    this.rooms = new Map<string, Room>();
  }
  createRoom(user1: User, user2: User) {
    const roomId = this.generate().toString();
    this.rooms.set(roomId.toString(), {
      user1,
      user2,
    });

    //sending offer to user2
    user1.socket.emit("send-offer", {
      roomId,
    });
  }

  //receiving the offer from the user1 and sending offer
  onOffer(roomId: string, sdp: string) {
    const user2 = this.rooms.get(roomId)?.user2;
    console.log("user2 is" + user2);
    user2?.socket.emit("offer", {
      sdp,
      roomId,
    });
  }

  //receving the offer from the user2 and sending answer
  onAnswer(roomId: string, sdp: string) {
    console.log("answer received");
    const user1 = this.rooms.get(roomId)?.user1;
    console.log("user1 is" + user1);
    user1?.socket.emit("answer", {
      sdp,
      roomId,
    });
  }
  generate() {
    return GLOBAL_ROOM_ID++;
  }
}
