import bluetooth

target_mac = "00:10:CC:4F:36:03"

print("Searching for services on:", target_mac)
services = bluetooth.find_service(address=target_mac)

if len(services) == 0:
    print("No services found.")
else:
    for svc in services:
        print(f"Service Name: {svc['name']}")
        print(f"  Host: {svc['host']}")
        print(f"  Description: {svc['description']}")
        print(f"  Provided By: {svc['provider']}")
        print(f"  Protocol: {svc['protocol']}")
        print(f"  Channel/Port: {svc['port']}")
        print(f"  Service Classes: {svc['service-classes']}")
        print(f"  Profiles: {svc['profiles']}")
        print("")
