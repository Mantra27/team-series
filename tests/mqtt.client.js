var mqtt = require("mqtt");

// password: Ac956$K*31uq
// username: visionweb

// Connection settings
const options = {
  host: "localhost",
  port: 1883,
  username: "nandan@dicot",
  password: "lmaodead",
};

const client = mqtt.connect(options);
client.on("connect", function () {
  // Channel of communication

  var topic = "/incoming";

  // qos = Quality of Service, helps if network is weak
  // this will notify if there is any update in the channel
  client.subscribe(topic, { qos: 1 });
  
  // publishes message on the channel
  client.publish(topic, JSON.stringify({data: [{device: 1, device: 2}], message: "hello world"}), { qos: 1 });
});

client.on("message", function (topic, message) {
  console.log(message.toString());
});