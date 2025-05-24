# HTTPv2 人脸识别设备后台对接协议接口文档

- **基于 HTTP  协议通信**
- **文档版本	6.0**
- **发布日期	2024年6月12日**
- **修改人 赖金杰**

## **更新记录**

| **版本号** | **修改日期** | **说明** |
| ---------- | ------------ | -------- |
|            |              |          |

# **HTTP协议说明**

- **支持HTTP 1.1
- **GZIP 压缩技术**
- **支持 TLS1.2  TLS1.3**

# **HTTP API 接口 **

## **调用流程**

- 设备先发送心跳包到服务器，服务器响应OK后
- 设备发送工作参数到服务器
- 服务器响应心跳保活包后，根据响应内容来决定下一步发起的请求
- **优先级 syncParameter > Remote > deletePeople > addPeople**
- 处理完服务器要求的操作后，检查有没有堆积的未上传记录
- 有堆积未上传记录则推送记录到服务器
- 设备需要保证两个心跳保活包间隔不要超过设定的轮询间隔。
- 即心跳间隔15秒， 如果第一次发心跳包时是 10:00:00 ,服务器响应中有删除或添加人员，就循环调用删除或添加人员接口，但要保障在10:00:15 时再次发送一次心跳。
  - **在两次心跳间隔中处理 参数同步、响应远程操作、删除人员、添加人员、推送记录的工作**

## **关于HTTP的连接保持**

- 设备应和服务器应首先通过保活包建立连接，服务器响应成功后，应保持HTTP的长连接直到所有操作都执行完毕后方可断开，如没有需要执行的操作，则可以立刻断开连接，直到下一次保活包
- 设备仅支持HTTP1.1.
- 一个设备应确保仅和服务器保持一个HTTP连接，避免多连接并发

## **异常处理**

### 网络异常

- 1、开机时就无法连接服务器，发送上传参数请求失败
  - 记录参数上传状态为未上传，通讯进入休眠，等待下次间隔时间
  - 间隔时间到了就发送心跳包，服务器没有响应则继续休眠等待
  - 心跳包有响应后，检查参数上传状态，未发送成功则发送一次，然后再继续响应服务器要求的后续操作（参考调用流程）
- 2、设备工作期间连接不上服务器
  - 发送任何请求都应加上超时时间和响应重试--  建议参数 超时时间2秒，超时重试次数3次
  - 请求失败后进入通讯休眠，等待保活包发送间隔到来
  - 后续流程参考问题1

### 服务器拒绝连接

- 设备发送打卡记录到服务器APIURL请求后，服务器返回的响应体中
- Success 字段返回值为 401/403 则表示无权限，设备应该进入请求静默，并等待下一个保活周期，保活周期后先发送保活
- hearder 中的的 Status 状态为 401/403/400 等异常时也要等待下一个保活包周期后，先发送保活包探测服务器状态。
- 直到服务器返回 HTTP状态200 和 Success 字段为1时才可继续执行其他API调用

# 连接保活

## **API-设备心跳保活包**

**简要描述：**

- 当设备空闲时，距离上次跟服务器通讯超过[保活间隔]秒后发送一次保活包，已确认是否有未完成的任务

**请求URL：**

- http://服务器 IP:port**/Device/Keepalive**

**请求方式：**

- POST

 **Content-Type**

- application/json

#### **请求参数**

| 字段             | 类型   | 说明                                                         |
| :--------------- | :----- | ------------------------------------------------------------ |
| SN               | string | 设备SN                                                       |
| RelayStatus      | int    | 继电器物状态<br>0--表示COM和NC常闭<br>1--表示COM和NO常闭     |
| KeepOpenStatus   | int    | 常开状态<br>0--表示常闭<br>1--表示常开                       |
| DoorSensorStatus | int    | 门磁状态<br>0--表示关<br>1--表示开                           |
| LockDoorStatus   | int    | 门锁定状态<br>0--表示未锁定<br>1--表示已锁定                 |
| AlarmStatus      | string | 门报警状态<br>空字符串为无报警，否则会有具体报警名称<br/>fire--消防报警<br/>blacklist--黑名单报警<br>anti--防拆报警<br/>illegal--非法验证<br/>password--胁迫报警密码<br/>openTimeout--开门超时报警<br/>doorSensor--门磁报警<br>有多个报警时，使用逗号分隔 fire,blacklist |

**请求参数示例**

```json
{
    "SN":"FC-8200H12345678", 
    "RelayStatus":	0,
    "KeepOpenStatus":	0,
    "DoorSensorStatus":	0,
    "LockDoorStatus":	0,
    "AlarmStatus":	"",
}
```

#### **返回值参数说明**

| 参数名              | 类型 | 是否必须 | 描述                                                         |
| ------------------- | ---- | -------- | ------------------------------------------------------------ |
| Success             | int  | 是       | 1:成功;<br>401/403 表示已连接服务器，但是由于SN未注册或安装，拒绝后续连接 |
|                     |      |          |                                                              |
| AddPeople           | int  | 否       | >0--表示有需要添加人员到设备<br>设备收到后需要发起 devicePass/selectPassInfo请求 <br>=0或无此字段时表示不需要处理 |
| DeletePeople        | int  | 否       | >0--表示需要从设备删除人员<br/>设备收到后需要发起 devicePass/selectDeleteInfo请求 |
| SyncParameter       | int  | 否       | 1--表示有参数需要设置到设备<br/>设备收到后需要发起 Device/DownloadWorkSetting 请求 |
| Remote              | int  | 否       | 1--表示有远程操作需要处理<br/>设备收到后需要发起 device/selectRestart 请求 |
| UploadWorkParameter | int  | 否       | 1--表示要求设备上传设备工作参数。<br>设备收到后需要发起 Device/UploadWorkSetting 请求 |

**返回值示例**

```json
{
    "Success":1,
    "AddPeople":1,
    "DeletePeople":1,
    "SyncParameter":1,
    "Remote":1,
    "UploadWorkParameter": 1
}

{
    "Success":1
}
```

- **优先级 UploadWorkParameter >Remote > SyncParameter> DeletePeople> AddPeople**

#### 返回错误代码

```json
{
    "Success":401   //返回401、400等非0值时。 表示设备再平台遇到问题，设备将不再发送打卡记录，设备参数到服务器。但还是会周期性发送保活包
}
/*
设备再做测试连接时，根据返回值提示的文字
(1)401 提示 
①中文：已连接服务器，但是该设备未激活
②英文：Connected to server, but device is not activated
(2)400 提示
①中文：已连接服务器，但SN不符合平台规则
②英文：Connected to server, but SN does not comply with platform rules
(3)0 提示
①中文：已连接服务器，测试完毕
②英文：Connected to server, testing completed

(4)其他根据Message内容提示
*/
```

# **设备工作参数**

参考文件  [设备工作参数.md](./设备工作参数.md)

## **API-上传当前设备参数**

**简要描述：**

- 设备开机时发送一次
- 设备属性变化时会再次上传

**请求URL：**

- http://服务器 IP:port**/Device/UploadWorkSetting**

**请求方式：**

- POST

 **Content-Type**

- application/json

**请求参数：**

-  **请求参数示例**

```json
{
	   "DeviceSN": "FC-8200H12345675",
        "FireAlarm": 0,
        "DoorLongOpenAlarm": 0,
        "DoorLongOpenTime": 0,
        "DoorSensorAlarm": 0,
        "DoorSensorAlarmTimegroup": {
            "Week1": "",
            "Week2": "",
            "Week3": "",
            "Week4": "",
            "Week5": "",
            "Week6": "",
            "Week7": ""
        },
        "BlacklistAlarm": 1,
        "AntiDisassemblyAlarm": 1,
        "IllegalVerificationAlarm": 0,
        "IllegalVerificationAlarmLimit": 30,
        "UseUserCloseAlarm": 1,
        "PasswordAlarm": 0,
        "PasswordAlarm_Password": "",
        "PasswordAlarm_Mode": 1,
        "AlarmClocks": [
            {
                "Num": 1,
                "Clock": "00:00",
                "Times": 0
            },
            {
                "Num": 24,
                "Clock": "00:00",
                "Times": 0
            }
        ],
        "UseBodyTemperature": 1,
        "UseFahrenheitDisplay": 1,
        "TemperatureCompensate": 0,
        "TemperatureAlarmThreshold": 37.29999,
        "TemperatureDisplay": 1,
        "CardBytes": 3,
        "AccessType": 0,
        "WgFormat": 26,
        "WGContent": 1,
        "ReleaseTime": 3,
        "FreeOpen": 0,
        "OpenInterval": 2,
        "OpenInterval_SaveRecord": 0,
        "Relay": 0,
        "ShortMessage": "",
        "VerificationType": 1,
        "OverdueRemind": 1,
        "OverdueRemind_Day": 3,
        "TimingOpen": 0,
        "TimingOpen_mode": 1,
        "TimingOpen_timegroup": {
            "Week1": "",
            "Week2": "",
            "Week3": "",
            "Week4": "",
            "Week5": "",
            "Week6": "",
            "Week7": ""
        },
        "TimingLocked": 0,
        "TimingLocked_timegroup": {
            "Week1": "",
            "Week2": "",
            "Week3": "",
            "Week4": "",
            "Week5": "",
            "Week6": "",
            "Week7": ""
        },
        "VisitorRootPassword": "",
        "MultiPerson": 1,
        "UseElevator": 0,
        "ElevatorPorts": [
            {
                "Num": 1,
                "RelayType": 2,
                "ReleaseTime": 2,
                "TimingOpen": {
                    "Use": 0,
                    "Open": 3,
                    "Timegroup": {
                        "Week1": "",
                        "Week2": "",
                        "Week3": "",
                        "Week4": "",
                        "Week5": "",
                        "Week6": "",
                        "Week7": ""
                    }
                }
            },
            {
                "Num": 64,
                "RelayType": 2,
                "ReleaseTime": 2,
                "TimingOpen": {
                    "Use": 0,
                    "Open": 3,
                    "Timegroup": {
                        "Week1": "",
                        "Week7": ""
                    }
                }
            }
        ],
        "FaceIR": 1,
        "FaceIRThreshold": 5,
        "FaceDistance": 3,
        "FaceThreshold": 58,
        "FPComparison": 80,
        "FaceMask": 0,
        "FaceMaskThreshold": 65,
        "Holidays": [],
        "Language": 1,
        "SystemTime": 1718421632,
        "UseNTP": 1,
        "TimeZone": 8,
        "Volume": 6,
        "Voice": 1,
        "ConnectPassword": "",
        "UseWired": 1,
        "WiredDHCP": 0,
        "WiredIP": "192.168.1.103",
        "WiredIPMask": "255.255.255.0",
        "WiredGteway": "192.168.1.1",
        "WiredDNS": "192.168.1.1",
        "WiredMAC": "7E-87-16-C1-E6-51",
        "UseWIFI": 0,
        "WIFIDHCP": 0,
        "WIFIIP": "192.168.1.150",
        "WIFIIPMask": "255.255.255.0",
        "WIFIGteway": "192.168.1.1",
        "WIFIDNS": "192.168.1.1",
        "WIFIMAC": "34-7D-E4-2D-63-3B",
        "WIFIAPName": "",
        "WIFIAPPassword": "",
        "UseWebPage": 1,
        "HTTPPort": 80,
        "HTTPSPort": 443,
        "WebPageUseSSL": 1,
        "UseUDP": 1,
        "UDPPort": 8101,
        "UseTelnet": 1,
        "TelnetPort": 23,
        "UseRTSP": 1,
        "RTSPPort": 554,
        "RTSPUser": "admin",
        "RTSPPassword": "12345678",
        "UseTCPClient": 0,
        "UseUDPClient": 0,
        "ServerAddress": "47.92.31.75",
        "ServerPort": 9003,
        "KeepaliveTime": 30,
        "UseHTTPClient": 0,
        "HTTPClient_ProtocolType": 100,
        "HTTPClient_ServerAddr": "http://192.168.1.100",
        "HTTPClient_KeepaliveTime": 30,
        "HTTPClient_UseGZIP": 0,
        "UseMQTTClient": 0,
        "UseMQTTSSL": 0,
        "MQTTServerAddr": "192.168.1.100",
        "MQTTPort": 0,
        "MQTTLoginName": "",
        "MQTTLoginPassword": "",
        "MQTTPublishTopic": "",
        "MQTTSubscribeTopic": "",
        "MQTT_KeepaliveTime": 30,
        "MQTT_UseGZIP": 0,
        "UseWebsocketClient": 0,
        "WebsocketClient_ProtocolType": 100,
        "WebsocketClient_ServerAddr": "ws://192.168.1.100/ws",
        "WebsocketClient_UseGZIP": 0,
        "WebsocketClient_KeepaliveTime": 30,
        "UseYZW": 0,
        "YZWAddr": "http://192.168.1.10",
        "RunDays": 0,
        "FormatCount": 0,
        "WatchDogCount": 7,
        "BootTime": 1718418194,
        "RelayStatus": 0,
        "KeepOpenStatus": 0,
        "DoorSensorStatus": 0,
        "LockDoorStatus": 0,
        "AlarmStatus": "\"\"",
        "RecordAutoCycle": 0,
        "SaveUnregistered": 1,
        "SaveRecordPicture": 1,
        "PeopleStorageInfo": {
            "Person": {
                "Max": 20000,
                "Current": 1
            },
            "Face": {
                "Max": 20000,
                "Current": 1
            },
            "Card": {
                "Max": 20000,
                "Current": 0
            },
            "Fingerprint": {
                "Max": 0,
                "Current": 0
            },
            "PalmVein": {
                "Max": 10000,
                "Current": 0
            },
            "Pasword": {
                "Max": 20000,
                "Current": 0
            },
            "Admin": {
                "Max": 5,
                "Current": 0
            }
        },
        "RecordStorageInfo": {
            "VerifyRecord": {
                "Max": 1000000,
                "Current": 4
            },
            "DoorRecord": {
                "Max": 10000,
                "Current": 4
            },
            "SystemRecord": {
                "Max": 10000,
                "Current": 7
            },
            "RecordPhoto": {
                "Max": 10000,
                "Current": 4
            }
        },
        "DeviceSN": "FC-8190H24052799",
        "DeviceName": "",
        "FirmwareVerson": "8.46",
        "FingerprintVerson": "-",
        "FaceVerson": "6.01",
        "Manufacturer": "",
        "ManufacturerPhone": "",
        "Website": "",
        "ProductionDate": "2024-06-15",
        "OEMText": "",
        "AutoRestart": 0,
        "AutoRestartTime": "02:00",
        "TimeGroups": [
            {
                "Num": 1,
                "Week1": "00:00-23:59",
                "Week2": "00:00-23:59",
                "Week3": "00:00-23:59",
                "Week4": "00:00-23:59",
                "Week5": "00:00-23:59",
                "Week6": "00:00-23:59",
                "Week7": "00:00-23:59"
            },
            {
                "Num": 64,
                "Week1": "",
                "Week7": ""
            }
        ],
        "DisplayBrightness": 6,
        "MenuPassword": "0000",
        "ShowIR": 0,
        "ShowPersonPhoto": 1,
        "PlayPersonName": 1,
        "RecognitionButton": 0,
        "UnregisteredWarn": 0,
        "ShowPersonName": 1,
        "FillLight": 2,
		"FunctionList":	{
			"BodyTemperature":	true,
			"Fingerprint":	false,
			"Palmvein":	true,
			"Face":	true,
			"QRCode":	true,
			"FaceMask":	true,
			"SafetyHelmet":	false,
			"Lift":	true,
			"AlarmClock":	true,
			"ExcelFile":	false,
			"ZipFile":	false,
			"TimeGroup":	64,
			"WIFI":	true,
			"HTTPClient_V1":	true,
			"HTTPClient_V2":	true,
			"MQTT":	true,
			"YZW":	true,
			"Websocket_V1":	true,
			"Websocket_V2":	true
		}
}
```

**返回参数说明**

| 参数名  | 类型   | 是否必须 | 描述                                                   |
| ------- | ------ | -------- | ------------------------------------------------------ |
| Success | int    | 是       | 1 表示操作成功;<br>!= 1时需要在 Message 中指出错误描述 |
| Message | string | 否       | 错误信息描述                                           |

 **返回值示例**

```
{
    "Success":1
}
```

## **API-设备主动拉取工作参数**

**简要描述：**

- 设备发送心跳包后，服务器响应的回包中字段SyncParameter = 1时，设备将请求此接口

**请求URL：**

- http://服务器 IP:port**/Device/DownloadWorkSetting **

**请求方式：**

- POST

 **Content-Type**

- application/json

**请求参数说明 **

| 参数名 | 类型   | 是否必须 | 描述    |
| ------ | ------ | -------- | ------- |
| SN     | string | 是       | 设备 ID |

 **请求参数示例**

```
{
    "SN":"FC-8200H12345678"
}
```

**返回参数说明**

| 字段           | 类型   | 必选 | 说明                                                       |
| :------------- | :----- | :--- | :--------------------------------------------------------- |
| Success        | int    | 是   | 1--表示成功<br>其他为错误代码，需要在Message中指出错误内容 |
| Message        | string | 否   | 错误信息描述，详情看第 3 章                                |
| 所有可修改参数 |        |      |                                                            |

**返回值示例**

```json
{
       "Success": 1,
	   "DeviceSN": "FC-8200H12345675",
        "FireAlarm": 0,
        "DoorLongOpenAlarm": 0,
        "DoorLongOpenTime": 0,
        "DoorSensorAlarm": 0,
        "DoorSensorAlarmTimegroup": {
            "Week1": "",
            "Week2": "",
            "Week3": "",
            "Week4": "",
            "Week5": "",
            "Week6": "",
            "Week7": ""
        },
        "BlacklistAlarm": 1,
        "AntiDisassemblyAlarm": 1,
        "IllegalVerificationAlarm": 0,
        "IllegalVerificationAlarmLimit": 30,
        "UseUserCloseAlarm": 1,
        "PasswordAlarm": 0,
        "PasswordAlarm_Password": "",
        "PasswordAlarm_Mode": 1,
        "AlarmClocks": [
            {
                "Num": 1,
                "Clock": "00:00",
                "Times": 0
            },
            {
                "Num": 24,
                "Clock": "00:00",
                "Times": 0
            }
        ],
        "UseBodyTemperature": 1,
        "UseFahrenheitDisplay": 1,
        "TemperatureCompensate": 0,
        "TemperatureAlarmThreshold": 37.29999,
        "TemperatureDisplay": 1,
        "CardBytes": 3,
        "AccessType": 0,
        "WgFormat": 26,
        "WGContent": 1,
        "ReleaseTime": 3,
        "FreeOpen": 0,
        "OpenInterval": 2,
        "OpenInterval_SaveRecord": 0,
        "Relay": 0,
        "ShortMessage": "",
        "VerificationType": 1,
        "OverdueRemind": 1,
        "OverdueRemind_Day": 3,
        "TimingOpen": 0,
        "TimingOpen_mode": 1,
        "TimingOpen_timegroup": {
            "Week1": "",
            "Week2": "",
            "Week3": "",
            "Week4": "",
            "Week5": "",
            "Week6": "",
            "Week7": ""
        },
        "TimingLocked": 0,
        "TimingLocked_timegroup": {
            "Week1": "",
            "Week2": "",
            "Week3": "",
            "Week4": "",
            "Week5": "",
            "Week6": "",
            "Week7": ""
        },
        "VisitorRootPassword": "",
        "MultiPerson": 1,
        "UseElevator": 0,
        "ElevatorPorts": [
            {
                "Num": 1,
                "RelayType": 2,
                "ReleaseTime": 2,
                "TimingOpen": {
                    "Use": 0,
                    "Open": 3,
                    "Timegroup": {
                        "Week1": "",
                        "Week2": "",
                        "Week3": "",
                        "Week4": "",
                        "Week5": "",
                        "Week6": "",
                        "Week7": ""
                    }
                }
            },
            {
                "Num": 64,
                "RelayType": 2,
                "ReleaseTime": 2,
                "TimingOpen": {
                    "Use": 0,
                    "Open": 3,
                    "Timegroup": {
                        "Week1": "",
                        "Week7": ""
                    }
                }
            }
        ],
        "FaceIR": 1,
        "FaceIRThreshold": 5,
        "FaceDistance": 3,
        "FaceThreshold": 58,
        "FPComparison": 80,
        "FaceMask": 0,
        "FaceMaskThreshold": 65,
        "Holidays": [],
        "Language": 1,
        "SystemTime": 1718421632,
        "UseNTP": 1,
        "TimeZone": 8,
        "Volume": 6,
        "Voice": 1,
        "ConnectPassword": "",
        "UseWired": 1,
        "WiredDHCP": 0,
        "WiredIP": "192.168.1.103",
        "WiredIPMask": "255.255.255.0",
        "WiredGteway": "192.168.1.1",
        "WiredDNS": "192.168.1.1",
        "WiredMAC": "7E-87-16-C1-E6-51",
        "UseWIFI": 0,
        "WIFIDHCP": 0,
        "WIFIIP": "192.168.1.150",
        "WIFIIPMask": "255.255.255.0",
        "WIFIGteway": "192.168.1.1",
        "WIFIDNS": "192.168.1.1",
        "WIFIMAC": "34-7D-E4-2D-63-3B",
        "WIFIAPName": "",
        "WIFIAPPassword": "",
        "UseWebPage": 1,
        "HTTPPort": 80,
        "HTTPSPort": 443,
        "WebPageUseSSL": 1,
        "UseUDP": 1,
        "UDPPort": 8101,
        "UseTelnet": 1,
        "TelnetPort": 23,
        "UseRTSP": 1,
        "RTSPPort": 554,
        "RTSPUser": "admin",
        "RTSPPassword": "12345678",
        "UseTCPClient": 0,
        "UseUDPClient": 0,
        "ServerAddress": "47.92.31.75",
        "ServerPort": 9003,
        "KeepaliveTime": 30,
        "UseHTTPClient": 0,
        "HTTPClient_ProtocolType": 100,
        "HTTPClient_ServerAddr": "http://192.168.1.100",
        "HTTPClient_KeepaliveTime": 30,
        "HTTPClient_UseGZIP": 0,
        "UseMQTTClient": 0,
        "UseMQTTSSL": 0,
        "MQTTServerAddr": "192.168.1.100",
        "MQTTPort": 0,
        "MQTTLoginName": "",
        "MQTTLoginPassword": "",
        "MQTTPublishTopic": "",
        "MQTTSubscribeTopic": "",
        "MQTT_KeepaliveTime": 30,
        "MQTT_UseGZIP": 0,
        "UseWebsocketClient": 0,
        "WebsocketClient_ProtocolType": 100,
        "WebsocketClient_ServerAddr": "ws://192.168.1.100/ws",
        "WebsocketClient_UseGZIP": 0,
        "WebsocketClient_KeepaliveTime": 30,
        "UseYZW": 0,
        "YZWAddr": "http://192.168.1.10",
        "RecordAutoCycle": 0,
        "SaveUnregistered": 1,
        "SaveRecordPicture": 1,
        "DeviceName": "",
        "Manufacturer": "",
        "ManufacturerPhone": "",
        "Website": "",
        "ProductionDate": "2024-06-15",
        "OEMText": "",
        "AutoRestart": 0,
        "AutoRestartTime": "02:00",
        "TimeGroups": [
            {
                "Num": 1,
                "Week1": "00:00-23:59",
                "Week2": "00:00-23:59",
                "Week3": "00:00-23:59",
                "Week4": "00:00-23:59",
                "Week5": "00:00-23:59",
                "Week6": "00:00-23:59",
                "Week7": "00:00-23:59"
            },
            {
                "Num": 64,
                "Week1": "",
                "Week7": ""
            }
        ],
        "DisplayBrightness": 6,
        "MenuPassword": "0000",
        "ShowIR": 0,
        "ShowPersonPhoto": 1,
        "PlayPersonName": 1,
        "RecognitionButton": 0,
        "UnregisteredWarn": 0,
        "ShowPersonName": 1,
        "FillLight": 2
}
```



# 远程控制

## **API-远程操作指令**

**简要描述：**

- 当心跳包返回值中Remote值为1时，设备立刻请求此接口获取远程操作命令

**请求URL：**

- http://服务器 IP:port**/Device/RemoteCommand**

**请求方式：**

- POST

 **Content-Type**

- application/json

**请求参数：**

| 字段 | 类型   | 长度 | 必选 | 说明   |
| :--- | :----- | :--- | :--- | ------ |
| SN   | string | 30   | 是   | 设备ID |

#### **请求参数示例**

```json
{
    "SN":"FC-8200H12345678"
}
```

#### **返回值参数说明**

| 参数名                 | 类型     | 是否必须 | 描述                                                         |
| ---------------------- | -------- | -------- | ------------------------------------------------------------ |
| Success                | int      | 是       | 1--表示成功<br>其他为错误代码，需要在Message中指出错误内容 ; <br/> 0--表示失败 |
| Message                | string   | 否       | 错误信息描述，详情看第3章                                    |
| Restart                | int      | 否       | 远程重启``0:不重启，1:重启                                   |
| Recover                | int      | 否       | 恢复出厂``0:正常，1：恢复出厂设置                            |
| Opendoor               | int      | 否       | 远程开门命令`` 0：不处理，`<br>`1--打开继电器;  2--使门常开；3--关闭门(解除常开)；`<br>`4--锁定门;5--解除门锁定 |
| Closealarm             | int      | 否       | 关闭报警命令``0:不处理，1:关闭所有正在发生的报警，并记录     |
| RepostRecord           | int      | 否       | 重新上传记录``0:不处理，1:将所有已上传记录重新标记为未上传并重新传输 |
| PushAllPeople          | int      | 否       | 要求上传所有已存储的人员名单到服务器<br/>此时设备调用API [/People/PushPeople] 发送人员名单  <br/>0--不需要处理，1--需要上传所有人员。 |
| QueryPeople            | [uint]   | 否       | 要求上传指定用户号的人员到服务器<br/>此时设备调用API [/People/PushPeople] 发送人员名单<br/>类型是 数组 |
| ClearRecord            | int      | 否       | 删除所有记录； 0-- 不处理  1--删除所有记录                   |
| RegisterIdentifyTicket | object   | 否       | 在设备上注册凭证类型<br />对象结构请查看 **RegisterIdentifyTicket 命令中的注册凭证对象结构**<br />注册完毕后调用API **/Device/RegisterIdentifyTicketResult** 上传结果 |
| PushSoftware           | object   | 否       | 推送软件固件升级包的下载url地址。<br />设备收到地址后，开始下载升级包，校验成功后就会自动更新固件。<br />对象结构请查看 **PushSoftware 命令中的固件文件对象结构** |
| PushSystemFile         | [object] | 否       | 推送系统文件更新信息，<br />数据为类型为数组<br />每个数组元素的对象结构请查看  **PushSystemFile 命令中的系统文件对象结构** |
| Snapshoot              | int      | 否       | 获取设备摄像头快照； 0-- 不处理  1--摄像头快照并上传<br />上传快照调用API  **/Device/RegisterIdentifyTicketResult** |
| OpenElevatorPort       | string   | 否       | 远程驱动一次电梯端口<br />逗号分隔的字符串：1,2,3,4,5        |
| KeepOpenElevatorPort   | string   | 否       | 使电梯端口进入常开状态<br />逗号分隔的字符串：1,2,3,4,5      |
| CloseElevatorPort      | string   | 否       | 使电梯端口退出常开状态<br />逗号分隔的字符串：1,2,3,4,5      |
| LockElevatorPort       | string   | 否       | 使电梯端口进入锁定状态，锁定时用户不可驱动<br />逗号分隔的字符串：1,2,3,4,5 |
| UnlockElevatorPort     | string   | 否       | 使电梯端口退出锁定状态<br />逗号分隔的字符串：1,2,3,4,5      |

#### **RegisterIdentifyTicket 命令中的注册凭证对象结构**

| 字段          | 类型 | 必选 | 说明                                                         |
| :------------ | :--- | :--- | ------------------------------------------------------------ |
| RegisterType  | uint | 是   | 注册的凭证类型<br />查看表格 **RegisterType 注册类型**       |
| UserID        | uint | 否   | 在设备上注册凭证的用户ID                                     |
| RegisterIndex | uint | 否   | 注册的凭证索引号<br />对于指纹的索引号是 0-9<br />对于掌静脉的索引号是 1-2 |

#### **RegisterType 注册类型**

| 值   | 说明       |
| :--- | ---------- |
| 1    | 注册卡     |
| 2    | 注册密码   |
| 3    | 注册指纹   |
| 4    | 注册人脸   |
| 5    | 注册掌静脉 |

#### **PushSoftware 命令中的固件文件对象结构**

| 字段        | 类型   | 长度 | 必选 | 说明                       |
| :---------- | :----- | :--- | :--- | -------------------------- |
| SoftwareURL | string | 1024 | 是   | 文件的URL地址              |
| SoftwareMD5 | string | 64   | 是   | 文件的MD5 hex编码格式 大写 |
| SoftwareVer | string |      | 是   | 文件的固件版本号           |

#### **PushSystemFile 命令中的系统文件对象结构**

| 字段      | 类型   | 长度 | 必选 | 说明                                                   |
| :-------- | :----- | :--- | :--- | ------------------------------------------------------ |
| FileURL   | string | 1024 | 是   | 文件的URL地址                                          |
| FileMD5   | string | 64   | 是   | 文件的MD5 hex编码格式 大写                             |
| FileType  | int    | 1    | 是   | 文件类型 <br />文件类型定义请查看 **FileType文件类型** |
| FileIndex | int    | 1    | 是   | 文件索引                                               |
| IsDelete  | int    | 1    | 是   | 是否表示需要删除文件                                   |

#### **FileType文件类型**

| 值   | 说明                                       |
| :--- | ------------------------------------------ |
| 1    | 待机图片 可以有8张图 <br> 支持索引范围 1-8 |
| 2    | 开机图片 只有一张图                        |







**返回值示例**

```json
//远程开门
{
    "Success":1,
    "Opendoor":1
}

//查询指定人员
{
    "Success":1,
    "QueryPeople":[1,2,3,4,5,6]
}

//注册凭证  给用户号为1的人员注册人脸
{
    "Success":1,
    "RegisterIdentifyTicket": 4,
    "RegisterIdentifyUserID": 1
}


```



## **API-反馈人员注册凭证的结果**

**简要描述：**

- 当收到人员注册凭证的远程命令后，设备进入注册凭证界面，并等待操作结果，注册凭证完毕后调用此API返回人员凭证注册结果
- 并调用推送人员API推送注册后的人员最新信息
- 使用表单上传的方式， Content-Type : multipart/form-data，返回的结果中可能包含图片

**请求URL：**

- http://服务器 IP:port**/Device/RegisterIdentifyTicketResult**

**请求方式：**

- POST

**Content-Type**

- multipart/form-data

**form-data 字段**

| 字段       | 类型   | 长度 | 必选 | 说明                     |
| :--------- | :----- | :--- | :--- | ------------------------ |
| ResultJson | string |      | 是   | 注册结果Json字符串       |
| Photo      | file   |      | 否   | 人员包含照片时，返回照片 |

**ResultJson 结构：**

| 字段             | 类型   | 长度 | 必选 | 说明                                                         |
| :--------------- | :----- | :--- | :--- | ------------------------------------------------------------ |
| SN               | string | 30   | 是   | 设备ID                                                       |
| UserID           | uint   |      | 是   | 用户号                                                       |
| Result           | int    |      | 是   | 注册凭证的结果<br />1、注册成功；<br />2、用户取消操作；<br />3--注册信息重复<br />4--不支持指纹<br />5--不支持掌静脉<br />6--设备正在忙 |
| RepetitionUserID | uint   |      | 否   | 当注册的凭证重复时，此处显示重复的用户号                     |
| UserDetail       | object |      | 否   | 当注册成功后，返回人员的最新详情，如果有人员照片<br />会返回人员照片 |

#### **请求参数示例**

```json
//重复注册返回
{
    "SN":"FC-8200H12345678",
    "UserID": 1,
    "Result": 2,
    "RepetitionUserID": 2
}
//成功注册返回
{
    "SN":"FC-8200H12345678",
    "UserID": 1,
    "Result": 1,
    "UserDetail": {
        "UserID": "3",
        "Name": "888888",
        "Job": "开发",
        "Department": "销售部",
        "IdentityCard": "",
        "Attachment": "",
        "Photo": "http://abc.com/photo/1.jpg",
        "PhotoMD5": "613D870CA99EDF074BEE4387BAB09070",
        "PhotoLen": 55020,
        "Password": "2222",
        "CardNum": "6666",
        "AccessType": 0,
        "ExpirationDate": 0,
        "OpenTimes": 65535,
        "KeepOpen": 1,
        "Timegroup": 6,
        "Holidays": "1,3,9,10,11,17,21,25,27,30",
        "Elevators": "1,2,3,4,5",
        "FaceFeature": "http://abc.com/face/1.dat",
        "FaceFeatureMD5": "613D870CA99EDF074BEE4387BAB09070",
        "Fingerprints": [
            {
                Num: 1,
                Data: "abcdefgrtygnfhgfjhk ... jhkghjkgj==",
                MD5: "abcdefg"
            }
        ],
        "Palmveins": [
            {
                Num: 1,
                Data: "abcdefgrtygnfhgfjhk ... jhkghjkgj==",
                MD5: "abcdefg"
            }
        ]
    }
}
```

#### **返回值参数说明**

| 参数名  | 类型   | 是否必须 | 描述                                                         |
| ------- | ------ | -------- | ------------------------------------------------------------ |
| Success | int    | 是       | 1--表示成功<br>其他为错误代码，需要在Message中指出错误内容 ; <br/> 0--表示失败 |
| Message | string | 否       | 错误信息描述，详情看第3章                                    |

**返回值示例**

```json
{
    "Success": 1
}
```



## **API-上传设备摄像头快照**

**简要描述：**

- 当收到获取摄像头快照的远程命令后，设备立刻对摄像头进行快照，并调用此接口上传
- 使用表单上传的方式， Content-Type : multipart/form-data，返回的结果包含图片

**请求URL：**

- http://服务器 IP:port**/Device/UploadSnapshoot**

**请求方式：**

- POST

**Content-Type**

- multipart/form-data

**form-data 字段**

| 字段  | 类型   | 长度 | 必选 | 说明             |
| :---- | :----- | :--- | :--- | ---------------- |
| SN    | string |      | 是   | 设备SN           |
| Photo | file   |      | 否   | 设备的摄像头快照 |

#### **返回值参数说明**

| 参数名  | 类型   | 是否必须 | 描述                                                         |
| ------- | ------ | -------- | ------------------------------------------------------------ |
| Success | int    | 是       | 1--表示成功<br>其他为错误代码，需要在Message中指出错误内容 ; <br/> 0--表示失败 |
| Message | string | 否       | 错误信息描述，详情看第3章                                    |

**返回值示例**

```json
{
    "Success": 1
}
```





# 人员管理

## **API-拉取人员授权信息**

**简要描述：**

- 当心跳保活，服务器返回值中带有需要拉取人员的字段并且值为1时，设备立刻发起此请求，并且循环请求

- 停止请求条件：1、服务器返回 Success:1，但是人员列表为空 ；2、Success==0

  

**请求URL：**

- http://服务器 IP:port**/People/DownloadPeopleList**

**请求方式：**

- POST

 **Content-Type**

- application/json

#### **请求参数**

| 字段  | 类型   | 长度 | 必选 | 说明                                                         |
| :---- | :----- | :--- | :--- | ------------------------------------------------------------ |
| SN    | string | 30   | 是   | 设备ID                                                       |
| Limit | int    | 10   | 是   | 每次请求返回的人员数量限制(最大1000)``设备按自身处理容量来设置此值 |

#### **请求参数示例**

```json
{
	"SN":"FC-8200H12345678", 
    "Limit": 100
}
```

#### **返回值参数说明**

| 参数名      | 类型   | 是否必须 | 描述                                                         |
| ----------- | ------ | -------- | ------------------------------------------------------------ |
| Success     | int    | 是       | 1--表示成功<br>其他为错误代码，需要在Message中指出错误内容 ; <br/> 0--表示失败 |
| Message     | string | 否       | 错误信息描述，详情看第3章                                    |
| PeopleCount | int    | 是       | 本次返回的人员数量                                           |
| PeopleList  | 数组   | 是       | 包含人员权限信息结构的数组                                   |

#### **PeopleJson人员数据格式**

| 参数名         | 类型   | 是否必须 | 描述                                                         |
| :------------- | :----- | :------- | :----------------------------------------------------------- |
| UserID         | string | 是       | 用户号 （数字 最大值 4294967295 类型 UINT32）                |
| Code           | string | 否       | 人员编号（字符<64位）                                        |
| Name           | string | 否       | 人员姓名（字符<64位）                                        |
| Job            | string | 否       | 职务（字符<64位）                                            |
| Department     | string | 否       | 部门（字符<64位）                                            |
| IdentityCard   | string | 否       | 身份证号码 （可空）（字符<64位）                             |
| Attachment     | string | 否       | 其他人员信息（字符<200位）                                   |
| Photo          | string |          | 照片信息，http或https开头表示使用url地址，否则表示使用base64 |
| PhotoMD5       | string | 否       | 照片的MD5  HEX字符串格式 （字符=32位）                       |
| PhotoLen       | int    | 否       | 照片的长度 最大支持400KB的图片                               |
| Password       | string | 否       | 密码,纯数字,长度：（0 / 4-8）                                |
| CardNum        | string | 否       | 卡号 （数字，最大值 18446744073709551615  类型 UINT62）      |
| QRCode         | string | 否       | 人员二维码信息 （字符<128位）                                |
| AccessType     | int    | 否       | 角色 0--普通人员；1--管理员; 2--黑名单                       |
| ExpirationDate | uint32 | 否       | 权限截止日期<br> unix 时间戳 秒级      0 表示无期限  <br>最大表示到 2099年12月31日 |
| OpenTimes      | int    | 否       | 开门次数 0-65535； <br>65535--表示无限制，0--表示禁止通行    |
| KeepOpen       | int    | 否       | 是否为常开卡，1--是；0--否                                   |
| Timegroup      | int    | 否       | 开门时段组 1-64；0--表示受限制                               |
| Holidays       | string | 否       | 节假日限制<br/>逗号分隔：1,2,3,4,5                           |
| Elevators      | string | 否       | 电梯端口权限数组<br/>逗号分隔：1,2,3,4,5                     |
| FaceFeature    | string | 否       | 人脸特征码 http或https开头表示使用url地址，否则表示使用base64<br>通过文件下载特征码，下载的文件内容是的base64内容 |
| FaceFeatureMD5 | string | 否       | 人脸特征码的MD5值 HEX字符串格式                              |
| Fingerprints   | []     | 否       | 指纹对象                                                     |
| Palmveins      | []     | 否       | 掌纹对象                                                     |

**字符是指字节，一个汉字占用3-4字节（utf8编码），一个英文字符占用1个字节。**

##### **Holidays 节假日**

- 为空字符串或无此字段表示不受节假日限制
- 为具体受限制的节假日编号,逗号分隔：1,2,3,4,5
- *号表示受所有节假日限制



- **Fingerprint 指纹对象**

| 序号 | 类型   | 必填 | 描述                                                         |
| ---- | ------ | ---- | ------------------------------------------------------------ |
| Num  | int    | 是   | 指纹索引号                                                   |
| Data | string | 是   | 指纹特征码  http或https开头表示使用url地址，否则表示使用base64<br/>通过文件下载特征码，下载的文件内容是的base64内容 |
| MD5  | string | 否   | 特征码的MD5值 HEX字符串格式                                  |

~~~json
[ //结构示例
    {
        Num: 1,
        Data: "http://abc.com/fp/1.dat",
        MD5: "abcdefg"
    },
    {
        Num: 2,
        Data: "abcdefgrtygnfhgfjhk ... jhkghjkgj==",
        MD5: "abcdefg"
    }
]
~~~




- **Palmvein 掌纹对象**

| 序号 | 类型   | 必填 | 描述                                                         |
| ---- | ------ | ---- | ------------------------------------------------------------ |
| Num  | int    | 是   | 掌纹索引号                                                   |
| Data | string | 是   | 掌纹特征码 http或https开头表示使用url地址，否则表示使用base64<br/>通过文件下载特征码，下载的文件内容是的base64内容 |
| MD5  | string | 否   | 特征码的MD5值 HEX字符串格式                                  |

  ~~~json
[ //结构示例
    {
        Num: 1,
        Data: "http://abc.com/palm/1.dat",
        MD5: "abcdefg"
    },
    {
        Num: 2,
        Data: "abcdefgrtygnfhgfjhk ... jhkghjkgj==",
        MD5: "abcdefg"
    }
]
  ~~~


- **Elevator 电梯权限**

```json
 //表示此人拥有1-5层的电梯权限
 [
     1,2,3,4,5
 ]
 //表示此人没有电梯权限
 [
   
 ]
 //表示此人仅拥有一个10层的电梯权限
 [
     10
 ]
```



#### **返回参数示例**

```json
{
    "Success": 1,
    "Count": 1,
    "PeopleList": [
        {
            "UserID": "3",
            "Name": "888888",
            "Job": "开发",
            "Department": "销售部",
            "IdentityCard": "",
            "Attachment": "",
            "Photo": "http://abc.com/photo/1.jpg",
            "PhotoMD5": "613D870CA99EDF074BEE4387BAB09070",
            "PhotoLen": 55020,
            "Password": "2222",
            "CardNum": "6666",
            "AccessType": 0,
            "ExpirationDate": 0,
            "OpenTimes": 65535,
            "KeepOpen": 1,
            "Timegroup": 6,
            "Holidays": "1,3,9,10,11,17,21,25,27,30",
            "Elevators": "1,2,3,4,5",
            "FaceFeature": "http://abc.com/face/1.dat",
            "FaceFeatureMD5": "613D870CA99EDF074BEE4387BAB09070",
            "Fingerprints": [
                {
                    Num: 1,
                    Data: "http://abc.com/fp/1.dat",
                    MD5: "abcdefg"
                }
            ],
            "Palmveins": [
                {
                    Num: 1,
                    Data: "http://abc.com/palm/1.dat",
                    MD5: "abcdefg"
                }
            ]
        },
        {
            "UserID": "444",
            "Name": "444",
            ...
            "Fingerprints": [],
            "Palmveins": []
        }
    ]
}
```

## **API-反馈拉取人员存储结果**

**简要描述：**

- 从服务器拉取一批人员导入后，调用此接口返回导入结果

**请求URL：**

- http://服务器 IP:port**/People/DownloadPeopleListResult**

**请求方式：**

- POST

 **Content-Type**

- application/json

**请求参数：**

| 字段         | 类型   | 长度 | 必选 | 说明                                    |
| :----------- | :----- | :--- | :--- | --------------------------------------- |
| SN           | string | 30   | 是   | 设备ID                                  |
| SuccessCount | int    | 20   | 是   | 导入成功的数量                          |
| FailCount    | int    | 20   | 是   | 导入失败的数量                          |
| FailList     | []     |      | 是   | 导入失败原因 code（具体描述参看错误码） |

**failEmployeeId 数组中失败信息结构**

| 参数名    | 类型   | 是否必须 | 描述                                          |
| --------- | ------ | -------- | --------------------------------------------- |
| UserID    | string | 是       | 用户号 （数字 最大值 4294967295 类型 UINT32） |
| ErrorCode | int    | 是       | 错误代码                                      |
| RepeatID  | string | 是       | 重复的用户号，此字段指示出这个人员跟谁重复    |
| ErrMsg    | string | 否       | 错误描述                                      |

**请求参数示例**

```json
{
    "SN":"FC-8200H12345678", 
    "SuccessCount":16,
    "FailCount":1, 
    "FailCount":[
    	{
    		"UserID":xxx, 
    		"ErrorCode":20,
			"RepeatID":123,
             "ErrMsg" : ""
            
    	},{
    		"UserID":”xxx”, 
    		"UserID":1,
             "ErrMsg" : ""
    ]
}
```

**errorCode 人员失败错误码**

| Success | 描述                                     |
| ------- | ---------------------------------------- |
| 1       | 人员信息参数异常，具体原因参考           |
| 2       | 人员照片URL下载失败                      |
| 3       | 人员照片图像太大不符合要求,需要小于500kb |
| 4       | 人脸特征码下载失败                       |
| 5       | 指纹特征码下载失败                       |
| 6       | 掌静脉特征码下载失败                     |
| 20      | 人脸特征码重复                           |
| 21      | 指纹特征码重复                           |
| 22      | 掌静脉特征码重复                         |
| 23      | 卡号重复                                 |
| 24      | 人员已存满                               |
| 25      | 查询数据时发生错误                       |
| 26      | 保存人员照片时发生错误                   |
| 27      | 人脸特征码格式错误                       |
| 28      | 指纹特征码格式错误                       |
| 29      | 掌静脉特征码格式错误                     |
| 30      | 照片不可识别                             |
| 31      | 保存指纹特征码时发生错误                 |
| 32      | 保存掌静脉特征码时发生错误               |

**返回值参数说明**

| 参数名  | 类型   | 是否必须 | 描述                                                         |
| ------- | ------ | -------- | ------------------------------------------------------------ |
| Success | int    | 是       | 1--表示成功<br>其他为错误代码，需要在Message中指出错误内容 ;<br/> 0--表示失败 |
| Message | string | 否       | 错误信息描述，详情看第3章                                    |

**返回值示例**

```
{
    "Success":1
}
```

![image-20210616205111411](image\image-20210616205111411.png)

## **API-拉取待删除人员**

**简要描述：**

- 发送心跳包后，服务器返回有需要删除的人员时调用，循环调用
- 停止循环条件 1、  Success:1,并且 deleteInfo 为空数组或无此字段  2、Success：0

**请求URL：**

- http://服务器 IP:port**/People/DeletePeopleList**

**请求方式：**

- POST

 **Content-Type**

- application/json

**请求参数：**

| 字段  | 类型   | 长度 | 必选 | 说明                                                 |
| :---- | :----- | :--- | :--- | ---------------------------------------------------- |
| SN    | string | 30   | 是   | 设备ID                                               |
| Limit | int    | 10   | 是   | 每次请求返回的人员数量限制(不携带则默认50，最大1000) |

**请求参数示例**

```
{
    "SN":"FC-8200H12345678"
}
```

**返回值参数说明**

| 参数名      | 类型   | 是否必须 | 描述                                                         |
| ----------- | ------ | -------- | ------------------------------------------------------------ |
| Success     | int    | 是       | 1--表示成功<br>其他为错误代码，需要在Message中指出错误内容 ; <br/> 0--表示失败 |
| Message     | string | 否       | 错误信息描述，详情看第3章                                    |
| DeleteAll   | int    | 否       | 1：清空所有人员信息  0：按指定用户号删除                     |
| DeleteCount | int    | 是       | 待删除人员数量                                               |
| DeleteList  | []     | 否       | DeleteAll=0时，此参数包含需要删除的用户号                    |



**返回值示例**

```json
{
    "Success":1,
    "DeleteAll":0, 
    "DeleteList":[
        1,2,3,4,5
    ]
}
```



## **API-反馈删除人员操作结果**

**简要描述：**

- 从服务器拉取一批人员导入后，调用此接口返回导入结果

**请求URL：**

- http://服务器 IP:port**/People/DeletePeopleListResult**

**请求方式：**

- POST

 **Content-Type**

- application/json

**请求参数：**

| 字段        | 类型   | 长度 | 必选 | 说明                               |
| :---------- | :----- | :--- | :--- | ---------------------------------- |
| SN          | string | 30   | 是   | 设备ID                             |
| DeleteCount | int    | 20   | 是   | 删除数量                           |
| DeleteAll   | int    | 20   | 是   | 1 已删除所有人员；0 仅删除指定人员 |
| DeleteList  | []     |      | 是   | 删除的人员编号                     |



**请求参数示例**

```json
{
    "SN":"FC-8200H12345678", 
    "DeleteCount":5,
    "DeleteAll":0, 
    "DeletList":[1,2,3,4,5]
}
```

**返回值参数说明**

| 参数名  | 类型   | 是否必须 | 描述                                                         |
| ------- | ------ | -------- | ------------------------------------------------------------ |
| Success | int    | 是       | 1--表示成功<br>其他为错误代码，需要在Message中指出错误内容 ; <br/> 0--表示失败 |
| Message | string | 否       | 错误信息描述，详情看第3章                                    |

**返回值示例**

```json
{
    "Success":1
}
```



## **API-推送人员信息**

**简要描述：**

- 当人员在设备上新增，修改人员时，将发生改变的人员信息上传到云平台
- 当服务器要求上传某个人员时，将人员信息推送到平台
- 当服务器要求上传所有人员时，将人员信息推送到平台

**请求URL：**

- http://服务器 IP:port**/People/PushPeople**

**请求方式：**

- POST

 **Content-Type**

- multipart/form-data

**请求参数：**

| 字段     | 类型   | 长度 | 必选 | 说明                                                         |
| :------- | :----- | :--- | :--- | ------------------------------------------------------------ |
| SN       | string | 30   | 是   | 设备ID                                                       |
| PushType | int    | 1    | 是   | 人员在设备中的改变类型：<br>1--新增；2--更新；3--删除；4--查询； |
| Detail   | class  |      | 否   | 人员详情，人员不存在时，则无此字段                           |
| Photo    | file   |      | 否   | 有人员照片时会上传照片文件                                   |
| UserID   | uint32 |      | 是   | 人员ID 本次推送的人员ID                                      |



**请求参数示例  带有人员照片、指纹特征码、掌静脉特征码**

```
POST /note/insertNoteFace HTTP/1.1
Accept: */*
Host: localhost:5000
Accept-Encoding: gzip, deflate, br
Connection: keep-alive
Content-Type: multipart/form-data; boundary=--------------------------506873351428002157394455
Content-Length: 17842

----------------------------506873351428002157394455
Content-Disposition: form-data; name="SN"

FC-8200H12345678
----------------------------506873351428002157394455
Content-Disposition: form-data; name="PushType"

1
----------------------------506873351428002157394455
Content-Disposition: form-data; name="Detail"
Content-Encoding: gzip
//以下内容上传时需要经过gzip压缩后再传输。  json 格式化网站 https://www.json.cn/
		{
            "UserID": "3",
            "Name": "888888",
            "Job": "开发",
            "Department": "销售部",
            "IdentityCard": "",
            "Attachment": "",
            "Photo": "http://abc.com/photo/1.jpg",
            "PhotoMD5": "613D870CA99EDF074BEE4387BAB09070",
            "PhotoLen": 55020,
            "Password": "2222",
            "CardNum": "6666",
            "AccessType": 0,
            "ExpirationDate": 0,
            "OpenTimes": 65535,
            "KeepOpen": 1,
            "Timegroup": 6,
            "Holidays": "1,3,9,10,11,17,21,25,27,30",
            "Elevators": "1,2,3,4,5",
            "FaceFeature": "http://abc.com/face/1.dat",
            "FaceFeatureMD5": "613D870CA99EDF074BEE4387BAB09070",
            "Fingerprints": [
                {
                    Num: 1,
                    Data: "abcdefgrtygnfhgfjhk ... jhkghjkgj==",
                    MD5: "abcdefg"
                }
            ],
            "Palmveins": [
                {
                    Num: 1,
                    Data: "abcdefgrtygnfhgfjhk ... jhkghjkgj==",
                    MD5: "abcdefg"
                }
            ]
        }
----------------------------506873351428002157394455
Content-Disposition: form-data; name="Photo"; filename="Photo.jpg"
Content-Type: image/jpeg

*****jpeg文件二进制内容*****
----------------------------506873351428002157394455--
```

**返回值参数说明**

| 参数名  | 类型   | 是否必须 | 描述                                                         |
| ------- | ------ | -------- | ------------------------------------------------------------ |
| Success | int    | 是       | 1--表示成功<br>其他为错误代码，需要在Message中指出错误内容 ; <br/> 0--表示失败 |
| Message | string | 否       | 错误信息描述，详情看第3章                                    |

**返回值示例**

```json
{
    "Success":1
}
```



# 在线鉴权

## **API-请求服务器鉴权**

**简要描述：**

- 当设备中有新的打卡记录时使用此接口
- 此接口每次仅支持上传一条打卡记录

**请求URL：**

- http://服务器 IP:port**/Device/RequestAuthorization**

**请求方式：**

- POST

 **Content-Type**

- multipart/form-data

**参数：**

| 字段         | 类型   | 长度 | 必选 | 说明                       |
| :----------- | :----- | :--- | :--- | -------------------------- |
| SN           | string | 30   | 是   | 设备SN                     |
| RecordDetail | string | 1000 | 是   | 记录详情，Json字符串       |
| Photo        | file   | 50KB | 否   | 记录中有图片时才需要此参数 |

#### **RecordDetail 字段说明**

| 字段         | 类型   | 长度 | 必选 | 说明                             |
| :----------- | :----- | :--- | :--- | -------------------------------- |
| RecordID     | long   | 10   | 是   | 请求ID                           |
| RecordType   | int    | 5    | 是   | 事件类型                         |
| RecordDate   | int64  | 20   | 是   | 打卡时间 unix时间戳              |
| UserID       | string | 20   | 否   | 用户ID                           |
| Code         | string | 64   | 否   | 人员编号                         |
| Name         | string | 64   | 否   | 人员姓名                         |
| IdentityCard | string | 64   | 否   | 身份证                           |
| Job          | string | 64   | 否   | 职务                             |
| Department   | string | 64   | 否   | 部门                             |
| CardNum      | string | 20   | 否   | 卡号                             |
| QRCode       | string | 128  | 否   | 二维码                           |
| IsEntry      | int    | 1    | 否   | 是否为进入，1表示进入，0表示出门 |
| BodyTemp     | int    | 5    | 否   | 人体测量温度 需要除10            |
| PhotoLen     | int    | 10   | 否   | 图片文件长度  0表示没有图片      |

#### **RecordDetail 参数示例**

```json
{
    "RecordID":	1718616771001,
    "RecordType":	3,
    "RecordDate":	1718616771,
    "UserID":	"1",
    "Name":	"1",
    "IdentityCard":	"",
    "Job":	"",
    "Department":	"",
    "CardNum":	"0",
    "QRCode":	"",
    "IsEntry":	1,
    "BodyTemp":	0,
    "PhotoLen":	40363
}
```

#### **请求示例**

```
POST /Device/RequestAuthorization HTTP/1.1
Accept: */*
Host: localhost:5000
Accept-Encoding: gzip, deflate, br
Connection: keep-alive
Content-Type: multipart/form-data; boundary=--------------------------506873351428002157394455
Content-Length: 17842
----------------------------506873351428002157394455
Content-Disposition: form-data; name="SN"

 FC-8380T12345678
----------------------------506873351428002157394455
Content-Disposition: form-data; name="RecordDetail"
Content-Encoding: gzip
Content-Type: application/octet-stream

//当开启请求压缩时，以下内容上传时需要经过gzip压缩后再传输。
{ "RecordID":120,"RecordType":3,"RecordDate":1718616771, "UserID":"1","Name":"1","IdentityCard":"","Job":"","Department":"","CardNum":"0","QRCode":"","IsEntry":1,"BodyTemp":0,"PhotoLen":40363}
----------------------------506873351428002157394455
Content-Disposition: form-data; name="pic"; filename="Postman_file.jpg"
Content-Type: image/jpeg

*****jpeg文件二进制内容*****
----------------------------506873351428002157394455--
```

#### **返回示例**

```json
{
	"Success": 1
}
```

#### 请求内容压缩

- fromdata中的 recordJson 字段，如果比较长时，可以使用内容压缩选项，在段落中携带 Content-Encoding: gzip

  ```
  Content-Disposition: form-data; name="RecordDetail"
  Content-Encoding: gzip
  
  ****压缩后的二进制内容****
  ```

 **返回参数说明**

| 参数名  | 类型   | 是否必须 | 描述                                                         |
| ------- | ------ | -------- | ------------------------------------------------------------ |
| Success | int    | 是       | 详情见表格 **Success 返回结果**                              |
| Message | string | 否       | 当禁止开门时，由服务器说明禁止原因<br />并由设备显示在屏幕上展示给打卡人员。 |



#### **Success 返回结果**

| 值   | 说明                         |
| :--- | ---------------------------- |
| 0    | 鉴权失败，拒绝开门           |
| 1    | 鉴权成功，开门并显示鉴权消息 |
| 2    | 鉴权成功，开门，不显示消息   |





# 记录管理

## **API-上传打卡记录**

**简要描述：**

- 当设备中有新的打卡记录时使用此接口
- 此接口每次仅支持上传一条打卡记录

**请求URL：**

- http://服务器 IP:port**/Record/UploadIdentifyRecord**

**请求方式：**

- POST

 **Content-Type**

- multipart/form-data

**参数：**

| 字段         | 类型   | 长度 | 必选 | 说明                       |
| :----------- | :----- | :--- | :--- | -------------------------- |
| SN           | string | 30   | 是   | 设备SN                     |
| RecordDetail | string | 1000 | 是   | 记录详情，Json字符串       |
| Photo        | file   | 50KB | 否   | 记录中有图片时才需要此参数 |

#### **RecordDetail 字段说明**

| 字段         | 类型   | 长度 | 必选 | 说明                             |
| :----------- | :----- | :--- | :--- | -------------------------------- |
| RecordID     | long   | 10   | 是   | 记录序号                         |
| RecordType   | int    | 5    | 是   | 事件类型                         |
| RecordDate   | int64  | 20   | 是   | 打卡时间 unix时间戳              |
| UserID       | string | 20   | 否   | 用户ID                           |
| Code         | string | 64   | 否   | 人员编号                         |
| Name         | string | 64   | 否   | 人员姓名                         |
| IdentityCard | string | 64   | 否   | 身份证                           |
| Job          | string | 64   | 否   | 职务                             |
| Department   | string | 64   | 否   | 部门                             |
| CardNum      | string | 20   | 否   | 卡号                             |
| QRCode       | string | 128  | 否   | 二维码                           |
| IsEntry      | int    | 1    | 否   | 是否为进入，1表示进入，0表示出门 |
| BodyTemp     | int    | 5    | 否   | 人体测量温度 需要除10            |
| PhotoLen     | int    | 10   | 否   | 图片文件长度  0表示没有图片      |



#### RecordType 事件类型

| 值   | 解释                                                |
| ---- | --------------------------------------------------- |
| 1    | 刷卡验证                                            |
| 2    | 指纹验证                                            |
| 3    | 人脸验证                                            |
| 4    | 刷卡 + 指纹                                         |
| 5    | 人脸 + 指纹                                         |
| 6    | 刷卡 + 人脸                                         |
| 7    | 刷卡 + 密码                                         |
| 8    | 人脸 + 密码                                         |
| 9    | 指纹 + 密码                                         |
| 10   | 密码验证  用户号加密码                              |
| 11   | 刷卡 + 指纹 + 密码                                  |
| 12   | 刷卡 + 人脸 + 密码                                  |
| 13   | 指纹 + 人脸 + 密码                                  |
| 14   | 刷卡 + 指纹 + 人脸                                  |
| 15   | 重复验证                                            |
| 16   | 有效期过期                                          |
| 17   | 开门时段过期                                        |
| 18   | 节假日时不能开门                                    |
| 19   | 未注册用户                                          |
| 20   | 探测锁定                                            |
| 21   | 有效次数已用尽                                      |
| 22   | 锁定时验证，禁止开门                                |
| 23   | 挂失卡                                              |
| 24   | 黑名单卡                                            |
| 25   | 免验证开门 -- 按指纹时用户号为0，刷卡时用户号是卡号 |
| 26   | 禁止刷卡验证  --  【权限认证方式】中禁用刷卡时      |
| 27   | 禁止指纹验证  --  【权限认证方式】中禁用指纹时      |
| 28   | 控制器已过期                                        |
| 29   | 验证通过—有效期即将过期                             |
| 30   | 体温异常，拒绝进入                                  |
| 31   | 访客密码开门                                        |
| 32   | 动态二维码扫码开门                                  |
| 33   | 在设备菜单中新增人员                                |
| 34   | 在设备菜单中修改人员                                |
| 35   | 在设备菜单中删除人员                                |
| 36   | 掌静脉识别                                          |
| 37   | 刷卡 + 掌静脉 + 人脸                                |
| 38   | 掌静脉 + 密码                                       |
| 39   | 刷卡 + 掌静脉                                       |
| 40   | 人脸 + 掌静脉                                       |
| 41   | 刷卡 + 掌静脉 + 密码                                |
| 42   | 掌静脉 + 人脸 + 密码                                |
| 43   | 指纹 + 掌静脉 + 人脸                                |
| 44   | 组合验证--等待下一个人员                            |
| 45   | 组合验证失败                                        |
| 46   | 组合验证完成                                        |
| 47   | 人证比对                                            |
| 48   | 卡未注册                                            |
| 49   | 未注册二维码                                        |

---

#### **RecordDetail 参数示例**

```json
{
    "RecordID":	120,
    "RecordType":	3,
    "RecordDate":	1718616771,
    "UserID":	"1",
    "Name":	"1",
    "IdentityCard":	"",
    "Job":	"",
    "Department":	"",
    "CardNum":	"0",
    "QRCode":	"",
    "IsEntry":	1,
    "BodyTemp":	0,
    "PhotoLen":	40363
}
```

#### **请求示例**

```
POST /note/insertNoteFace HTTP/1.1
Accept: */*
Host: localhost:5000
Accept-Encoding: gzip, deflate, br
Connection: keep-alive
Content-Type: multipart/form-data; boundary=--------------------------506873351428002157394455
Content-Length: 17842
----------------------------506873351428002157394455
Content-Disposition: form-data; name="SN"

 FC-8380T12345678
----------------------------506873351428002157394455
Content-Disposition: form-data; name="recordJson"
Content-Encoding: gzip
Content-Type: application/octet-stream

//当开启请求压缩时，以下内容上传时需要经过gzip压缩后再传输。
{ "RecordID":120,"RecordType":3,"RecordDate":1718616771, "UserID":"1","Name":"1","IdentityCard":"","Job":"","Department":"","CardNum":"0","QRCode":"","IsEntry":1,"BodyTemp":0,"PhotoLen":40363}
----------------------------506873351428002157394455
Content-Disposition: form-data; name="pic"; filename="Postman_file.jpg"
Content-Type: image/jpeg

*****jpeg文件二进制内容*****
----------------------------506873351428002157394455--
```

#### **返回示例**

```json
{
	"Success": 1
}
```

#### 返回错误代码

```json
{
    "Success":401   //返回401 表示设备未授权，设备将不再发送打卡记录，设备参数到服务器。但还是会周期性发送保活包
}
//设备返回 401表示此次记录未上传成功
```

- 设备等待服务器响应时间为30秒；
- 如果服务器返回错误代码，则等待10秒后重新上传记录；

#### 请求内容压缩

- fromdata中的 recordJson 字段，如果比较长时，可以使用内容压缩选项，在段落中携带 Content-Encoding: gzip

  ```
  Content-Disposition: form-data; name="recordJson"
  Content-Encoding: gzip
  
  ****压缩后的二进制内容****
  ```

 **返回参数说明**

| 参数名  | 类型 | 是否必须 | 描述                                                         |
| ------- | ---- | -------- | ------------------------------------------------------------ |
| Success | int  | 是       | 1--表示成功<br>其他为错误代码，需要在Message中指出错误内容 ; <br/> 0--表示失败 |







## **API-上传系统记录**

**简要描述：**

- 当设备中有新的系统记录时使用此接口
- 此接口会批量上传系统记录

**请求URL：**

- http://服务器 IP:port**/Record/UploadSystemRecord**

**请求方式：**

- POST

 **Content-Type**

- application/json

**参数：**

| 字段       | 类型   | 长度 | 必选 | 说明     |
| :--------- | :----- | :--- | :--- | -------- |
| SN         | string | 30   | 是   | 设备SN   |
| RecordType | int    | 1    | 是   | 记录类型 |
| Records    | 【】   | 1000 | 是   | 记录列表 |

#### **Record 字段说明**

| 字段       | 类型  | 长度 | 必选 | 说明                               |
| :--------- | :---- | :--- | :--- | ---------------------------------- |
| RecordID   | long  | 10   | 是   | 记录序号                           |
| RecordType | int   | 5    | 是   | 事件类型<br>1-门磁记录;2--系统记录 |
| RecordDate | int64 | 20   | 是   | 打卡时间 unix时间戳                |

#### **RecordType字段说明**

| 值   | 说明     |
| :--- | -------- |
| 1    | 门磁记录 |
| 2    | 系统记录 |

#### RecordType -- 门磁记录 事件类型

| 值   | 解释                   |
| ---- | ---------------------- |
| 1    | 门磁-开门              |
| 2    | 门磁-关门              |
| 3    | 进入门磁报警检测状态   |
| 4    | 退出门磁报警检测状态   |
| 5    | 门未关好               |
| 6    | 使用按钮开门           |
| 7    | 按钮开门时门已锁定     |
| 8    | 按钮开门时控制器已过期 |



#### RecordType -- 系统记录 事件类型

| 值   | 解释                               |
| ---- | ---------------------------------- |
| 1    | 软件开门                           |
| 2    | 软件关门                           |
| 3    | 软件常开                           |
| 4    | 控制器自动进入常开                 |
| 5    | 控制器自动关闭门                   |
| 6    | 长按出门按钮常开                   |
| 7    | 长按出门按钮常闭                   |
| 8    | 软件锁定                           |
| 9    | 软件解除锁定                       |
| 10   | 控制器定时锁定--到时间自动锁定     |
| 11   | 控制器定时锁定--到时间自动解除锁定 |
| 12   | 报警--锁定                         |
| 13   | 报警--解除锁定                     |
| 14   | 非法认证报警                       |
| 15   | 门磁报警                           |
| 16   | 胁迫报警                           |
| 17   | 开门超时报警                       |
| 18   | 黑名单报警                         |
| 19   | 消防报警                           |
| 20   | 防拆报警                           |
| 21   | 非法认证报警解除                   |
| 22   | 门磁报警解除                       |
| 23   | 胁迫报警解除                       |
| 24   | 开门超时报警解除                   |
| 25   | 黑名单报警解除                     |
| 26   | 消防报警解除                       |
| 27   | 防拆报警解除                       |
| 28   | 系统加电                           |
| 29   | 系统错误复位（看门狗）             |
| 30   | 设备格式化记录                     |
| 31   | 读卡器接反。                       |
| 32   | 读卡器线路未接好。                 |
| 33   | 无法识别的读卡器                   |
| 34   | 网线已断开                         |
| 35   | 网线已插入                         |
| 36   | WIFI 已连接                        |
| 37   | WIFI 已断开                        |
| 38   | 蓝牙开门                           |
| 39   | 点名超时                           |
| 40   | 在设备菜单中清空所有人员           |
| 41   | 在设备菜单中备份人员到U盘          |
| 42   | 在设备菜单中从U盘导入人员          |
| 43   | 室内机远程开门                     |
| 44   | 删除所有记录                       |
| 45   | 删除所有人员                       |

---

#### **RecordDetail 参数示例**

```json
 [
     {
         "RecordID":	1,
         "RecordType":	1,
         "RecordDate":	1718616771
     },
     {
         "RecordID":	2,
         "RecordType":	1,
         "RecordDate":	1718616772
     }
 ]

```

#### **参数示例**

~~~json
 {
     "SN":	"FC-8380T12345678",
     "RecordType":	1,
     "Records":	 [
         {
             "RecordID":	1,
             "RecordType":	1,
             "RecordDate":	1718616771
         },
         {
             "RecordID":	2,
             "RecordType":	1,
             "RecordDate":	1718616772
         }
     ]
 }
~~~







#### **返回示例**

```json
{
	"Success": 1
}
```

#### 返回错误代码

```json
{
    "Success":401   //返回401 表示设备未授权，设备将不再发送打卡记录，设备参数到服务器。但还是会周期性发送保活包
}
//设备返回 401表示此次记录未上传成功
```

- 设备等待服务器响应时间为30秒；
- 如果服务器返回错误代码，则等待10秒后重新上传记录；

 **返回参数说明**

| 参数名  | 类型 | 是否必须 | 描述                                                         |
| ------- | ---- | -------- | ------------------------------------------------------------ |
| Success | int  | 是       | 1--表示成功<br>其他为错误代码，需要在Message中指出错误内容 ; <br/> 0--表示失败 |







